"use client"

import { Badge } from "@/components/ui/badge"
import { ReactNode } from "react"

interface PageHeaderProps {
    title: ReactNode;
    description: ReactNode;
    length?: number;
    children?: ReactNode;
}

const PageHeader = ({ title, description, length, children }: PageHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="grid gap-1">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl sm:text-2xl text-primary font-semibold uppercase tracking-normal">{title}</h1>
                    {length && <Badge className="rounded-full">{length}</Badge>}
                </div>
                <p className="text-muted-foreground text-sm sm:text-base max-w-150">    
                    {description}
                </p>
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    )
}

export default PageHeader
