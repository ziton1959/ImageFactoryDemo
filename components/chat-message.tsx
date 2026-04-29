import type { Message } from "@/app/page"
import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3 py-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-foreground" : "bg-primary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-background" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      <div
        className={cn(
          "flex-1 max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-foreground text-background rounded-tr-sm"
            : "bg-secondary text-secondary-foreground rounded-tl-sm"
        )}
      >
        <div className="prose prose-sm max-w-none">
          {message.content.split("\n").map((line, index) => {
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={index} className="font-semibold my-1">
                  {line.replace(/\*\*/g, "")}
                </p>
              )
            }
            if (line.includes("**")) {
              const parts = line.split(/(\*\*.*?\*\*)/g)
              return (
                <p key={index} className="my-1">
                  {parts.map((part, i) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={i}>{part.replace(/\*\*/g, "")}</strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              )
            }
            if (line.trim() === "") {
              return <br key={index} />
            }
            return (
              <p key={index} className="my-1">
                {line}
              </p>
            )
          })}
        </div>
        <time className={cn(
          "text-[10px] mt-2 block",
          isUser ? "text-background/60" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </div>
    </div>
  )
}
