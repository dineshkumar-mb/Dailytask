export const MEMORY_EXTRACTION_PROMPT = `Analyze the conversation turns below and extract user preferences, long-term goals, routines, constraints, and key personal facts.
Ignore transient or ephemeral updates.

Output JSON:
{
  "memories": [
    {
      "content": "Description of fact or preference",
      "type": "preference" | "goal" | "routine" | "constraint" | "fact" | "decision" | "project" | "relationship",
      "confidence": 0.0 to 1.0
    }
  ]
}`;
