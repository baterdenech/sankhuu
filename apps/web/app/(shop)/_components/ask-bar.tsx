"use client";

import { SparkleIcon } from "./catalog-icons";
import { openAssistant } from "./assistant";

// Нүүр/хайлт/дэлгүүрийн хуудсанд AI туслахыг нээх мөр. `prompt` өгвөл шууд тэр асуултаар эхэлнэ.
export function AskBar({ title = "AI туслахаас асуу", text = "«Эмээдээ бэлэг, 50 мянгаас доош» гэх мэтээр бичихэд тохирох барааг олж өгнө", prompt, compact = false }: { title?: string; text?: string; prompt?: string; compact?: boolean }) {
  if (compact) {
    return (
      <button type="button" className="btn small ai-btn" onClick={() => openAssistant(prompt)}>
        <SparkleIcon size={16} /> {title}
      </button>
    );
  }
  return (
    <button type="button" className="ask-bar" onClick={() => openAssistant(prompt)}>
      <span className="ai-avatar">
        <SparkleIcon size={18} />
      </span>
      <span className="ask-bar-body">
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
      <span className="chev">›</span>
    </button>
  );
}
