import { Suspense } from "react"
import LocationSearch from "@/components/location-search"
import StoreResults from "@/components/store-results"
import ShoppingList from "@/components/shopping-list"
import { SearchResults } from "@/components/search-results"
import { UserProvider } from "@/contexts/user-context"
import { Header } from "@/components/layout/header"

export default function Home() {
  return (
    <UserProvider>
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Find Nearby Stores</h2>
            <LocationSearch />

            <Suspense
              fallback={<div className="mt-6 p-4 border rounded-lg animate-pulse bg-muted/50">Loading stores...</div>}
            >
              <StoreResults />
            </Suspense>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Shopping List</h2>
            <ShoppingList />

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <SearchResults />
            </div>
          </div>
        </div>
      </main>
    </UserProvider>
  )
}
