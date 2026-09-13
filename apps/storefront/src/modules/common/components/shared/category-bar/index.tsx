"use client"

import React, { useRef, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { clx } from "@modules/common/components/ui"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"

type Category = {
  id: string
  name: string
  handle?: string
}

type CategoryBarCarouselProps = {
  categories: Category[]
  selectedCategory?: string
  onSelectCategory?: (categoryName: string, categoryHandle?: string) => void
  countryCode?: string
  className?: string
}

const CategoryBarCarousel = ({
  categories,
  selectedCategory = "All",
  onSelectCategory,
  countryCode,
  className,
}: CategoryBarCarouselProps) => {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)

  const allItems = useMemo(() => [{ id: "all", name: "All" }, ...categories], [categories])

  const normalizedSelectedCategory = useMemo(() => {
    if (!selectedCategory || selectedCategory.toLowerCase() === "all") {
      return "All"
    }
    const found = allItems.find(
      (cat) => cat.name.toLowerCase() === selectedCategory.toLowerCase()
    )
    return found?.name ?? "All"
  }, [selectedCategory, allItems])

  const checkScrollBoundaries = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }, [])

  const scrollTo = useCallback((direction: "left" | "right") => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollStep = Math.max(container.clientWidth * 0.6, 220)
    const target =
      direction === "left"
        ? container.scrollLeft - scrollStep
        : container.scrollLeft + scrollStep
    container.scrollTo({
      left: target,
      behavior: "smooth",
    })
    setTimeout(checkScrollBoundaries, 350)
  }, [checkScrollBoundaries])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeftState(scrollContainerRef.current.scrollLeft)
    setDragDistance(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.3
    setDragDistance(Math.abs(walk))
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk
    checkScrollBoundaries()
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleClick = (categoryName: string, categoryHandle?: string) => {
    if (dragDistance < 6) {
      if (onSelectCategory) {
        onSelectCategory(categoryName, categoryHandle)
        return
      }

      const targetHandle =
        categoryName.toLowerCase() === "all" ? "" : categoryHandle
      const path =
        targetHandle && countryCode
          ? `/${countryCode}/categories/${targetHandle}`
          : targetHandle
            ? `/categories/${targetHandle}`
            : "/categories"

      router.push(path)
    }
  }

  return (
    <section
      id="category-carousel-bar"
      className={clx(
        "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8",
        className
      )}
      aria-label="Category Navigation"
    >
      <div className="relative flex items-center rounded-2xl p-1.5 sm:p-2">
        {/* Left Scroll Button */}
        <button
          id="category-carousel-prev"
          type="button"
          onClick={() => scrollTo("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className={clx(
            "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer select-none active:scale-95 z-10",
            !canScrollLeft && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
          style={
            canScrollLeft
              ? {
                  backgroundColor: "var(--cat-inactive-bg)",
                  color: "var(--cat-inactive-text)",
                  borderColor: "var(--cat-inactive-border)",
                  boxShadow: "var(--cat-btn-shadow-rest)",
                }
              : undefined
          }
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Left Gradient Fade */}
        <div
          className={clx(
            "absolute left-10 sm:left-12 top-1.5 bottom-1.5 w-6 bg-gradient-to-r from-white/90 to-transparent dark:from-slate-950/90 pointer-events-none z-[1] transition-opacity duration-200",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Carousel Scrollable Buttons Track */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollBoundaries}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none px-2 py-0.5 select-none scroll-smooth cursor-grab active:cursor-grabbing w-full"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {allItems.map((cat) => {
            const isSelected =
              normalizedSelectedCategory.toLowerCase() === cat.name.toLowerCase()

            return (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                data-category-name={cat.name.toLowerCase()}
                type="button"
                onClick={() => handleClick(cat.name, cat.handle)}
                className={clx(
                  "shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 cat-btn",
                  isSelected && "cat-btn-active"
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Right Gradient Fade */}
        <div
          className={clx(
            "absolute right-10 sm:right-12 top-1.5 bottom-1.5 w-6 bg-gradient-to-l from-white/90 to-transparent dark:from-slate-950/90 pointer-events-none z-[1] transition-opacity duration-200",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Right Scroll Button */}
        <button
          id="category-carousel-next"
          type="button"
          onClick={() => scrollTo("right")}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className={clx(
            "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer select-none active:scale-95 z-10",
            !canScrollRight && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
          style={
            canScrollRight
              ? {
                  backgroundColor: "var(--cat-inactive-bg)",
                  color: "var(--cat-inactive-text)",
                  borderColor: "var(--cat-inactive-border)",
                  boxShadow: "var(--cat-btn-shadow-rest)",
                }
              : undefined
          }
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}

export default CategoryBarCarousel
