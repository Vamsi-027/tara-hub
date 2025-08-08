"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Sparkles } from "lucide-react"
import { useStrategy } from "@/hooks/use-strategy"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

export function StrategyView() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ai: false,
    channels: false,
    seo: false,
    creative: false,
  })

  const [aiTheme, setAiTheme] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<any[]>([])

  const { data, loading, error } = useStrategy()

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleAIGeneration = async () => {
    if (!aiTheme.trim()) return

    setAiLoading(true)
    // Simulate AI call
    setTimeout(() => {
      setAiResults([
        {
          hook: "Cozy Fall Transition: 3 Easy Swaps",
          goal: "Education & Inspiration",
          creativeType: "Reel",
          hashtags: "#falldecor #cozyhome #seasonaltransition #homedecor #autumnvibes",
        },
        {
          hook: "Your Fall Favorites Are Here!",
          goal: "Product Promotion",
          creativeType: "Carousel",
          hashtags: "#newcollection #fallmusthaves #homedecor #shopsmall #cozyliving",
        },
        {
          hook: "Show Us Your Fall Corner",
          goal: "Community Engagement",
          creativeType: "IG Story",
          hashtags: "#fallcorner #cozyhome #showusyourstyle #ugc #falldecor",
        },
      ])
      setAiLoading(false)
    }, 2000)
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Strategy Hub</h1>
          <p className="text-destructive">Error loading strategy data: {error}</p>
        </div>
      </div>
    )
  }

  // Check if data is empty
  const isEmpty = !loading && (!data || (
    (!data.channels || data.channels.length === 0) &&
    (!data.seoKeywords || data.seoKeywords.length === 0) &&
    (!data.blogPosts || data.blogPosts.length === 0) &&
    (!data.creativeGuidelines || data.creativeGuidelines.length === 0)
  ))

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Strategy Hub</h1>
          <p className="text-muted-foreground">
            This section contains the high-level strategic frameworks guiding this month's activities. Explore the
            channel-specific plans, SEO keywords, and creative guidelines that define the brand's voice and market
            approach.
          </p>
        </div>
        
        <EmptyState 
          type="strategy"
          onAction={() => {
            // This could trigger a modal or navigation to a strategy setup page
            console.log("Define strategy clicked")
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Strategy Hub</h1>
        <p className="text-muted-foreground">
          This section contains the high-level strategic frameworks guiding this month's activities. Explore the
          channel-specific plans, SEO keywords, and creative guidelines that define the brand's voice and market
          approach.
        </p>
      </div>

      <div className="space-y-4">
        {/* AI Content Ideation */}
        <Card>
          <Collapsible open={openSections.ai} onOpenChange={() => toggleSection("ai")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    AI Content Ideation
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.ai ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Need inspiration? Describe a theme or product, and our AI assistant will generate three distinct post
                  ideas for you.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Theme or Product
                    </label>
                    <Input
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      placeholder="e.g., Early Fall Decor"
                    />
                  </div>

                  <Button
                    onClick={handleAIGeneration}
                    disabled={aiLoading || !aiTheme.trim()}
                    className="w-full sm:w-auto"
                  >
                    {aiLoading ? "Generating..." : "Generate Ideas"}
                  </Button>
                </div>

                {aiResults.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {aiResults.map((idea, index) => (
                      <div key={index} className="bg-muted/50 p-4 rounded-lg border">
                        <h4 className="font-medium">{idea.hook}</h4>
                        <p className="text-sm mt-1">
                          <strong className="text-muted-foreground">Goal:</strong> {idea.goal}
                        </p>
                        <p className="text-sm">
                          <strong className="text-muted-foreground">Creative:</strong> {idea.creativeType}
                        </p>
                        <p className="text-sm">
                          <strong className="text-muted-foreground">Hashtags:</strong>{" "}
                          <span className="text-blue-600">{idea.hashtags}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Channel Strategies */}
        <Card>
          <Collapsible open={openSections.channels} onOpenChange={() => toggleSection("channels")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle>Channel-Specific Strategies</CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.channels ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {loading
                  ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)
                  : data?.channels.map((channel) => (
                      <div key={channel.id} className="space-y-3">
                        <h4 className="font-medium">{channel.platform}</h4>
                        <ul className="space-y-2 ml-4">
                          {channel.points.map((point, index) => (
                            <li key={index} className="text-sm text-muted-foreground list-disc">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* SEO Strategy */}
        <Card>
          <Collapsible open={openSections.seo} onOpenChange={() => toggleSection("seo")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle>SEO & Content Strategy</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.seo ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium">Primary Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {data?.seoKeywords
                          .filter((keyword) => keyword.type === "primary")
                          .map((keyword) => (
                            <Badge key={keyword.id} variant="secondary">
                              {keyword.text}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Long-Tail Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {data?.seoKeywords
                          .filter((keyword) => keyword.type === "longTail")
                          .map((keyword) => (
                            <Badge key={keyword.id} variant="outline">
                              {keyword.text}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Content Hub (Blog)</h4>
                      <ul className="space-y-2 ml-4">
                        {data?.blogPosts.map((post) => (
                          <li key={post.id} className="text-sm text-muted-foreground list-disc">
                            <strong>{post.date}:</strong> {post.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Creative Guidelines */}
        <Card>
          <Collapsible open={openSections.creative} onOpenChange={() => toggleSection("creative")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle>Creative & Messaging Guidelines</CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.creative ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {loading
                  ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)
                  : data?.creativeGuidelines.map((guideline) => (
                      <p key={guideline.id} className="text-sm">
                        {guideline.text.split(":").map((part, index) =>
                          index === 0 ? (
                            <strong key={index} className="font-medium">
                              {part}:
                            </strong>
                          ) : (
                            <span key={index} className="text-muted-foreground">
                              {part}
                            </span>
                          ),
                        )}
                      </p>
                    ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  )
}
