import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Plus, MapPin } from "@medusajs/icons"

const RegionsListPage = () => {
  const navigate = useNavigate()
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/regions")
      if (response.ok) {
        const data = await response.json()
        // Ensure each region has the required fields to prevent split errors
        const fixedRegions = (data.regions || []).map((region: any) => ({
          ...region,
          currency_code: region.currency_code || "usd",
          countries: region.countries || [],
          payment_providers: region.payment_providers || [],
          fulfillment_providers: region.fulfillment_providers || [],
          tax_rate: region.tax_rate || 0,
          // Fix any undefined fields that might cause split() errors
          iso_2: region.iso_2 || "",
          iso_3: region.iso_3 || "",
        }))
        setRegions(fixedRegions)
      }
    } catch (error) {
      console.error("Failed to fetch regions:", error)
      setRegions([])
    } finally {
      setLoading(false)
    }
  }

  const formatCountries = (countries: any[]) => {
    if (!countries || countries.length === 0) {
      return "No countries"
    }

    // Safely handle country data
    const countryList = countries.map(c => {
      // Handle both string and object formats
      if (typeof c === 'string') {
        return c.toUpperCase()
      }
      // Safely access properties with fallbacks
      return (c?.iso_2 || c?.iso || c?.code || "").toUpperCase()
    }).filter(Boolean) // Remove empty values

    if (countryList.length === 0) {
      return "No countries"
    }

    if (countryList.length > 3) {
      return `${countryList.slice(0, 3).join(", ")} +${countryList.length - 3}`
    }

    return countryList.join(", ")
  }

  const formatProviders = (providers: any[]) => {
    if (!providers || providers.length === 0) {
      return "None"
    }

    // Safely handle provider data
    const providerList = providers.map(p => {
      if (typeof p === 'string') {
        // Handle string format, avoid calling split on undefined
        return p.split('_').pop() || p
      }
      // Handle object format with null checks
      const id = p?.id || p?.provider_id || ""
      // Only split if id exists and is a string
      return typeof id === 'string' && id.includes('_')
        ? id.split('_').pop() || id
        : id
    }).filter(Boolean)

    return providerList.length > 0 ? providerList.join(", ") : "None"
  }

  const handleCreateRegion = () => {
    navigate("/app/settings/regions/create")
  }

  const handleRegionClick = (regionId: string) => {
    navigate(`/app/settings/regions/${regionId}`)
  }

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-base"></div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <Heading level="h1">Regions</Heading>
          </div>
          <Button onClick={handleCreateRegion} variant="primary">
            <Plus className="mr-2" />
            Create Region
          </Button>
        </div>
        <Text className="text-ui-fg-subtle mt-2">
          Manage the regions that you will operate within
        </Text>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Currency</Table.HeaderCell>
            <Table.HeaderCell>Countries</Table.HeaderCell>
            <Table.HeaderCell>Payment Providers</Table.HeaderCell>
            <Table.HeaderCell>Fulfillment</Table.HeaderCell>
            <Table.HeaderCell>Tax Rate</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {regions.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center text-ui-fg-muted">
                No regions configured. Create a region to get started.
              </Table.Cell>
            </Table.Row>
          ) : (
            regions.map((region) => (
              <Table.Row
                key={region.id}
                className="cursor-pointer hover:bg-ui-bg-subtle"
                onClick={() => handleRegionClick(region.id)}
              >
                <Table.Cell className="font-medium">
                  {region.name || "Unnamed Region"}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="default">
                    {(region.currency_code || "USD").toUpperCase()}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {formatCountries(region.countries)}
                </Table.Cell>
                <Table.Cell>
                  {formatProviders(region.payment_providers)}
                </Table.Cell>
                <Table.Cell>
                  {formatProviders(region.fulfillment_providers)}
                </Table.Cell>
                <Table.Cell>
                  {region.tax_rate || 0}%
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

export default RegionsListPage

// This replaces the default region list to fix the split() error
export const config = defineRouteConfig({
  label: "Regions",
  icon: MapPin,
})