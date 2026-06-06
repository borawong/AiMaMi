import * as React from "react"
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"nav">) => {
  const { t } = useTranslation()

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel ?? t("ui.pagination.navigation")}
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation()

  return (
    <PaginationLink
      aria-label={ariaLabel ?? t("ui.pagination.previousPage")}
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{children ?? t("ui.pagination.previous")}</span>
    </PaginationLink>
  )
}
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation()

  return (
    <PaginationLink
      aria-label={ariaLabel ?? t("ui.pagination.nextPage")}
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>{children ?? t("ui.pagination.next")}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) => {
  const { t } = useTranslation()

  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <Ellipsis className="h-4 w-4" />
      <span className="sr-only">{children ?? t("ui.pagination.morePages")}</span>
    </span>
  )
}
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
