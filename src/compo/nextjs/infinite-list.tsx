/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { Loader2 } from "lucide-react"; // Shadcn or Lucide icon

interface InfiniteListProps<T> {
  initialData: T[];
  initialMeta?: {
    totalPages: number;
    page: number;
  };
  fetchAction: (page: number) => Promise<any>; // Updated to handle server meta response
  renderItem: (item: T, index: number) => React.ReactNode; // Render function
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export default function InfiniteList<T>({
  initialData,
  initialMeta,
  fetchAction,
  renderItem,
  className = "grid grid-cols-1 gap-4",
  loadingComponent,
  emptyComponent,
}: InfiniteListProps<T>) {
  
  const { data, loading, hasMore, lastElementRef } = useInfiniteQuery({
    initialData,
    initialMeta,
    fetchAction,
  });

  if (data.length === 0 && !loading) {
    return emptyComponent || <div className="text-center p-12 text-muted-foreground">No items found</div>;
  }

  return (
    <div className={className}>
      {data.map((item, index) => {
        const isLast = index === data.length - 1;
        
        return (
          <div 
            ref={isLast ? lastElementRef : null} 
            key={(item as any).id || (item as any)._id || index}
          >
            {renderItem(item, index)}
          </div>
        );
      })}

      {loading && (
        <div className="col-span-full flex justify-center p-8">
          {loadingComponent || <Loader2 className="animate-spin h-8 w-8 text-primary/60" />}
        </div>
      )}
      
      {!hasMore && data.length > 0 && (
        <div className="col-span-full text-center text-muted-foreground text-sm p-8 bg-muted/30 rounded-xl mt-4">
          You have reached the end of the list
        </div>
      )}
    </div>
  );
}


// For use in server components, you can pass initialMeta to prefetch data

// export default async function Page() {
//   const { data, meta } = await getAllProducts(1, 10); 

//   return (
//     <div className="p-10">
//       <InfiniteList 
//         initialData={data} 
//         initialMeta={meta}
//         fetchAction={getAllProducts}
//         renderItem={(item) => (
//           <div className="border p-4">{item.name}</div>
//         )}
//       />
//     </div>
//   )
// }
