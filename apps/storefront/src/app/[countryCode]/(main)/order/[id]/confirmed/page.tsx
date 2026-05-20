import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

async function OrderContent({ id }: { id: string }) {
  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} />
}

export default async function OrderConfirmedPage(props: Props) {
  const { id } = await props.params
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <OrderContent id={id} />
    </Suspense>
  )
}
