"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <footer className="border-t border-border bg-card p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-5 h-5" />
            <span className="sr-only">Attach file</span>
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Describe your VM image requirements..."}
            className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[40px] max-h-[200px] py-2.5 placeholder:text-muted-foreground"
            rows={1}
            disabled={isLoading}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          HPE Image Builder can help you create custom VM images with automated validation and compliance checks.
        </p>
      </form>
    </footer>
  )
}
