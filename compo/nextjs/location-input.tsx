"use client"

import * as React from "react"
import Image from "next/image"
import { useJsApiLoader } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const LIBRARIES: ("places")[] = ["places"]

// Karachi, Pakistan Bounds
const KARACHI_BOUNDS = {
  north: 25.15,
  south: 24.75,
  east: 67.35,
  west: 66.85,
}

export interface LocationData {
  address: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  lat?: number
  lng?: number
}

interface LocationInputProps {
  value: string
  onChange: (value: string, data?: LocationData) => void
  placeholder?: string
  className?: string
  error?: boolean
  hideIcon?: boolean
}

export function LocationInput({
  value,
  onChange,
  placeholder = "Search location...",
  className,
  error,
  hideIcon = false,
}: LocationInputProps) {
  const [open, setOpen] = React.useState(false)
  const [predictions, setPredictions] = React.useState<google.maps.places.AutocompletePrediction[]>([])
  const [inputValue, setInputValue] = React.useState(value || "")
  const [isFetching, setIsFetching] = React.useState(false)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  })

  const autocompleteService = React.useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = React.useRef<google.maps.places.PlacesService | null>(null)
  const sessionToken = React.useRef<google.maps.places.AutocompleteSessionToken | null>(null)

  React.useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService()
      sessionToken.current = new google.maps.places.AutocompleteSessionToken()
      // PlacesService requires an HTML element, but we can use a dummy one
      const dummyElement = document.createElement('div')
      placesService.current = new google.maps.places.PlacesService(dummyElement)
    }
  }, [isLoaded])

  // Sync internal input value with prop value
  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const fetchPredictions = React.useCallback(
    (input: string) => {
      if (!input || !autocompleteService.current) {
        setPredictions([])
        return
      }

      setIsFetching(true)
      const sw = new google.maps.LatLng(KARACHI_BOUNDS.south, KARACHI_BOUNDS.west)
      const ne = new google.maps.LatLng(KARACHI_BOUNDS.north, KARACHI_BOUNDS.east)
      const bounds = new google.maps.LatLngBounds(sw, ne)

      autocompleteService.current.getPlacePredictions(
        {
          input,
          sessionToken: sessionToken.current!,
          bounds,
          componentRestrictions: { country: "pk" },
          locationBias: bounds,
          types: ['geocode', 'establishment'],
        },
        (results, status) => {
          setIsFetching(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Further filter results to ensure they are within Karachi bounds manually if needed
            // But strictBounds equivalent in API is locationRestriction which is better
            setPredictions(results)
          } else {
            setPredictions([])
          }
        }
      )
    },
    []
  )

  const handleInputChange = (val: string) => {
    setInputValue(val)
    onChange(val)
    if (val.length > 2) {
      setOpen(true)
      fetchPredictions(val)
    } else {
      setPredictions([])
      setOpen(false)
    }
  }

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return

    setInputValue(prediction.description)
    setOpen(false)

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'address_components'],
        sessionToken: sessionToken.current!,
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = place.formatted_address || prediction.description
          const locationData: LocationData = {
            address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          }

          place.address_components?.forEach((component) => {
            const types = component.types
            if (types.includes("locality")) {
              locationData.city = component.long_name
            } else if (types.includes("administrative_area_level_1")) {
              locationData.state = component.long_name
            } else if (types.includes("country")) {
              locationData.country = component.long_name
            } else if (types.includes("postal_code")) {
              locationData.postalCode = component.long_name
            }
          })

          onChange(address, locationData)
          // Reset session token for next search
          sessionToken.current = new google.maps.places.AutocompleteSessionToken()
        }
      }
    )
  }

  return (
    <div className="relative w-full">
      <Popover open={open && predictions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            {!hideIcon && <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                !hideIcon && "pl-9", 
                error && "border-destructive focus-visible:ring-destructive", 
                className
              )}
              onFocus={() => inputValue.length > 2 && setOpen(true)}
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-70 shadow-xl border-border" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="w-full">
            <CommandList className="max-h-75 overflow-y-auto">
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                No results found in Karachi
              </CommandEmpty>
              <CommandGroup>
                {predictions.map((prediction) => (
                  <CommandItem
                    key={prediction.place_id}
                    value={prediction.description}
                    onSelect={() => handleSelect(prediction)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {prediction.structured_formatting.main_text}
                      </span>
                      <span className="text-xs text-muted-foreground truncate leading-tight">
                        {prediction.structured_formatting.secondary_text}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-end px-4 py-2 border-t border-border bg-muted/30">
              <Image 
                src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" 
                alt="Powered by Google" 
                width={120}
                height={18}
                className="h-3 w-auto opacity-60 grayscale hover:grayscale-0 transition-all"
              />
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {!isLoaded && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
