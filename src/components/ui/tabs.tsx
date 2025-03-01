"use client"

import React, { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

// Create a context to manage tab state
type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

// Custom hook to access the tabs context
const useTabs = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider")
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) => {
  // Local state for uncontrolled usage
  const [tabValue, setTabValue] = useState(defaultValue)

  // Determine if it's controlled or uncontrolled
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : tabValue

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setTabValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange }}
    >
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    role="tablist"
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  disabled?: boolean
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled = false, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabs()
    const isSelected = selectedValue === value

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isSelected}
        disabled={disabled}
        data-state={isSelected ? "active" : "inactive"}
        onClick={() => onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isSelected 
            ? "bg-background text-foreground shadow-sm" 
            : "hover:bg-background/50 hover:text-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  forceMount?: boolean
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, forceMount, ...props }, ref) => {
    const { value: selectedValue } = useTabs()
    const isSelected = selectedValue === value

    if (!isSelected && !forceMount) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isSelected ? "active" : "inactive"}
        tabIndex={isSelected ? 0 : -1}
        hidden={!isSelected && !forceMount}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }