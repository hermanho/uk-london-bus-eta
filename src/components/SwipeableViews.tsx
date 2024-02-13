// https://github.com/oliviertassinari/react-swipeable-views/issues/676#issuecomment-1933572772
import { useEffect, useRef } from "react"

export function SwipeableViews(
  { className = "", index, onChangeIndex, ...rootProps }: 
    { index: number, onChangeIndex: (index: number) => void } & React.HTMLProps<HTMLDivElement>
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<number>()

  useEffect(() => {
    containerRef.current?.children[index]?.scrollIntoView({ behavior: "smooth" })
  }, [index])

  return (
    <div
      {...rootProps}
      ref={containerRef}
      className={
        "flex snap-x snap-mandatory items-stretch overflow-x-scroll " +
        "*:w-full *:flex-shrink-0 *:snap-center " + className
      }
      onScroll={({ currentTarget }) => {
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        scrollTimeout.current = window.setTimeout(() => {
          const pageWidth = currentTarget.scrollWidth / currentTarget.children.length
          onChangeIndex(Math.round(currentTarget.scrollLeft / pageWidth))
        }, 100)
      }}
    />
  )
}