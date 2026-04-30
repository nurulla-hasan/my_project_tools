import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator, 
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

type BreadcrumbLinkItem = {
  name: string
  href?: string
  isCurrent?: boolean
}

type CustomBreadcrumbProps = {
  links: BreadcrumbLinkItem[]
}

const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({ links }) => { 
  return (
    <Breadcrumb className="hidden md:block mb-4 container mx-auto px-0">
      <BreadcrumbList>
        {links.map((link, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {link.href && !link.isCurrent ? ( 
                <BreadcrumbLink asChild>
                  <Link href={link.href}>{link.name}</Link>
                </BreadcrumbLink>
              ) : ( 
                <BreadcrumbPage>{link.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < links.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;