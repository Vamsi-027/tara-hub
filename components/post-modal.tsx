"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { DBPost } from "@/lib/db-schema"

interface PostModalProps {
  post: DBPost | null
  mode: "view" | "edit" | "create"
  isOpen: boolean
  onClose: () => void
  onSave: (post: Partial<DBPost>) => void
  onDelete?: () => void
}

export function PostModal({ post, mode, isOpen, onClose, onSave, onDelete }: PostModalProps) {
  const [formData, setFormData] = useState<Partial<DBPost>>({})

  useEffect(() => {
    if (post && (mode === "view" || mode === "edit")) {
      setFormData(post)
    } else if (mode === "create") {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        status: "Draft",
        theme: "Custom",
        goal: "",
        idea: "",
        type: "Static Photo",
        copy: "",
        keywords: "",
        hashtags: "",
        channels: [],
        cta: "",
        kpi: "Track Manually",
        notes: "",
        boost: false,
      })
    }
  }, [post, mode])

  const handleSave = () => {
    onSave(formData)
  }

  if (mode === "view" && post) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {post.boost && <Badge className="bg-teal-100 text-teal-800">BOOSTED POST</Badge>}
              <Badge variant="outline">{post.status}</Badge>
            </div>

            <div>
              <h3 className="font-bold text-lg text-stone-800">{post.idea}</h3>
              <p className="text-sm italic text-stone-600 mt-1">
                <strong>Goal:</strong> {post.goal}
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-md">{post.copy}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-stone-600">Creative:</strong> {post.type}
              </div>
              <div>
                <strong className="text-stone-600">Channels:</strong> {post.channels.join(", ")}
              </div>
              <div>
                <strong className="text-stone-600">CTA:</strong> {post.cta}
              </div>
              <div>
                <strong className="text-stone-600">KPI:</strong> {post.kpi}
              </div>
              <div className="md:col-span-2">
                <strong className="text-stone-600">Hashtags:</strong>{" "}
                <span className="text-blue-700">{post.hashtags}</span>
              </div>
              {post.notes && (
                <div className="md:col-span-2">
                  <strong className="text-stone-600">Creative Notes:</strong> {post.notes}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  // Switch to edit mode
                  window.location.reload() // Simple way to switch modes
                }}
              >
                Edit Post
              </Button>
              {onDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  Delete Post
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Post" : "Edit Post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="idea">Idea / Hook</Label>
            <Textarea
              id="idea"
              value={formData.idea || ""}
              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <Textarea
              id="goal"
              value={formData.goal || ""}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="copy">Copy</Label>
            <Textarea
              id="copy"
              value={formData.copy || ""}
              onChange={(e) => setFormData({ ...formData, copy: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="hashtags">Hashtags</Label>
            <Textarea
              id="hashtags"
              value={formData.hashtags || ""}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {mode === "create" ? "Create Post" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
