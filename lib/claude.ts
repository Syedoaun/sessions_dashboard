import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// claude-haiku-4-5: vision model, ~20x cheaper than Opus, handles handwriting well
const MODEL = 'claude-haiku-4-5-20251001'

export async function extractAttendance(base64Image: string, mediaType: string) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64Image },
          },
          {
            type: 'text',
            text: `This is an attendance sheet from a school session. Extract every student record you can see.
Return ONLY a JSON array with no extra text, like:
[
  { "student_name": "Ahmed Khan", "class": "7-A", "has_signature": true },
  { "student_name": "Sara Ali", "class": "6-B", "has_signature": false }
]
- class: use exactly what is written (e.g. "7-A", "Grade 6", "Class 8")
- has_signature: true if there is a signature/checkmark in that row, false otherwise
- If a field is illegible, make your best guess or use an empty string`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse attendance data from image')
  return JSON.parse(jsonMatch[0]) as { student_name: string; class: string; has_signature: boolean }[]
}

export async function extractFeedback(base64Image: string, mediaType: string) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64Image },
          },
          {
            type: 'text',
            text: `This is a student feedback form from a school session. Extract the filled-in responses.
Return ONLY a JSON object with no extra text, like:
{
  "student_name": "Ahmed Khan",
  "class": "7-A",
  "understanding_level": "understand_basics",
  "would_attend_more": "yes",
  "trainer_rating": "excellent",
  "learned_something": "yes",
  "favourite_part": "the group activity",
  "additional_comments": "please do more sessions"
}

Rules:
- understanding_level: one of "still_confused", "understand_basics", "need_more_practice" (match the checked box)
- would_attend_more: one of "yes", "maybe", "no"
- trainer_rating: one of "excellent", "average", "poor"
- learned_something: one of "yes", "not_much", "no"
- Use null for any field left blank or unclear`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse feedback data from image')
  return JSON.parse(jsonMatch[0])
}
