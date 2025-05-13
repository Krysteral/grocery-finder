"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PrinterIcon, Store, Car, Clock, Fuel } from "lucide-react"

interface PrintableShoppingListProps {
  storeGroups: any[]
  totalCost: number
  totalWithGas: number
  taxCost?: number
  travelInfo: {
    totalDistance: number
    totalTravelTime: string
    totalGasCost: number
  }
}

export default function PrintableShoppingList({
  storeGroups,
  totalCost,
  travelInfo,
  totalWithGas,
  taxCost,
}: PrintableShoppingListProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to print your shopping lists")
      return
    }

    // Get the styles from the current document
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch (e) {
          // Ignore cross-origin stylesheets
          return ""
        }
      })
      .join("\n")

    // Create the print document
    printWindow.document.write(`
      <html>
        <head>
          <title>Shopping Lists</title>
          <style>
            ${styles}
            @media print {
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .store-card {
                break-inside: avoid;
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
              }
              .store-header {
                background-color: #f8fafc;
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
              }
              .store-content {
                padding: 16px;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
              }
              .item-row:last-child {
                border-bottom: none;
              }
              .checkbox {
                width: 16px;
                height: 16px;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                margin-right: 8px;
                display: inline-block;
              }
              .store-total {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #e2e8f0;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
              }
              .grand-total {
                margin-top: 24px;
                padding: 12px 16px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background-color: #f8fafc;
                font-weight: bold;
                font-size: 18px;
                display: flex;
                justify-content: space-between;
              }
              .no-print {
                display: none;
              }
              .price-info {
                text-align: right;
              }
              .price-each {
                font-size: 0.9em;
              }
              .price-total {
                font-size: 0.8em;
                color: #64748b;
              }
              .travel-info {
                margin-top: 16px;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background-color: #f8fafc;
              }
              .travel-info-title {
                font-weight: bold;
                margin-bottom: 8px;
              }
              .travel-info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
              }
              .travel-info-item {
                text-align: center;
                padding: 8px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                background-color: white;
              }
              .travel-info-value {
                font-weight: bold;
                font-size: 1.1em;
              }
              .travel-info-label {
                font-size: 0.8em;
                color: #64748b;
              }
              .store-address {
                font-size: 0.9em;
                color: #64748b;
                margin-top: 4px;
              }
              .store-distance {
                font-size: 0.8em;
                color: #64748b;
                margin-top: 4px;
              }
              .separator {
                height: 1px;
                background-color: #e2e8f0;
                margin: 16px 0;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)

    // Wait for content to load then print
    printWindow.document.close()
    printWindow.addEventListener("load", () => {
      printWindow.focus()
      printWindow.print()
      // Don't close the window after print to allow for reprinting
    })
  }

  const today = new Date().toLocaleDateString()
  const isSingleStore = storeGroups.length === 1

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{isSingleStore ? "Your Shopping List" : "Your Shopping Lists"}</h2>
        <Button onClick={handlePrint} className="no-print">
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Shopping {isSingleStore ? "List" : "Lists"}
        </Button>
      </div>

      <div ref={printRef}>
        <div className="print-header">
          <h1 className="text-2xl font-bold">{isSingleStore ? "Shopping List" : "Shopping Lists"}</h1>
          <p className="text-muted-foreground">Generated on {today}</p>
        </div>

        {storeGroups.map((store) => (
          <Card key={store.storeId} className="mb-6 store-card">
            <CardHeader className="pb-3 store-header">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    {store.storeName}
                  </CardTitle>
                  <CardDescription className="store-address">{store.storeAddress}</CardDescription>
                  <div className="store-distance flex items-center mt-1 text-xs text-muted-foreground">
                    <Car className="h-3 w-3 mr-1" />
                    {store.distanceFromUser.toFixed(1)} miles •
                    <Clock className="h-3 w-3 mx-1" />
                    {store.travelTime} •
                    <Fuel className="h-3 w-3 mx-1" />${store.gasCost.toFixed(2)} gas
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Store Total</span>
                  <p className="font-semibold">${store.subtotal.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="store-content">
              <div className="space-y-1">
                {store.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0 item-row">
                    <div className="flex items-center">
                      <span className="inline-block w-5 h-5 border rounded mr-3 checkbox"></span>
                      <span>
                        {item.name} <span className="text-muted-foreground">(x{item.quantity})</span>
                      </span>
                    </div>
                    <div className="text-right price-info">
                      <div className="price-each">${item.price.toFixed(2)} each</div>
                      <div className="price-total">${item.subtotal.toFixed(2)} total</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-2 flex justify-between items-center font-medium store-total">
                <span>Store Total:</span>
                <span>${store.subtotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="travel-info">
          <div className="travel-info-title">Travel Information</div>
          <div className="travel-info-grid">
            <div className="travel-info-item">
              <div className="travel-info-value">{travelInfo.totalDistance.toFixed(1)} miles</div>
              <div className="travel-info-label">Total Distance</div>
            </div>
            <div className="travel-info-item">
              <div className="travel-info-value">{travelInfo.totalTravelTime}</div>
              <div className="travel-info-label">Total Travel Time</div>
            </div>
            <div className="travel-info-item">
              <div className="travel-info-value">${travelInfo.totalGasCost.toFixed(2)}</div>
              <div className="travel-info-label">Gas Cost</div>
            </div>
          </div>
        </div>

        <div className="separator"></div>

        <div className="p-4 border rounded-lg flex justify-between items-center mt-6 grand-total">
          <div>
            <span className="font-bold">Grand Total:</span>
            <div className="text-xs text-muted-foreground">Items + Gas</div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold">${totalWithGas.toFixed(2)}</span>
            <div className="text-xs text-muted-foreground">
              ${totalCost.toFixed(2)} items + ${travelInfo.totalGasCost.toFixed(2)} gas
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t pt-4">
        <h2 className="text-xl font-bold mb-2">Cost Summary</h2>
        <div className="flex justify-between mb-1">
          <span>Items Subtotal:</span>
          <span>${totalCost.toFixed(2)}</span>
        </div>
        {taxCost !== undefined && (
          <div className="flex justify-between mb-1">
            <span>Tax (8.5%):</span>
            <span>${taxCost.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Estimated Gas Cost:</span>
          <span>${travelInfo.totalGasCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>Total:</span>
          <span>${totalWithGas.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
