import { Text } from "@mantine/core";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
}

export function ChatMessageBubble({ content, role }: ChatMessageProps) {
  if (role === "user") {
    return (
      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
        {content}
      </Text>
    );
  }

  return (
    <div className="chat-message-markdown">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
