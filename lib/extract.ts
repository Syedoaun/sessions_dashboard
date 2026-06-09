import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// gemini-2.5-flash: free tier — 1,500 requests/day, better reasoning + vision than 2.0
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function extractAttendance(base64Image: string, mimeType: string) {
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: base64Image,
      },
    },
    `This is an attendance sheet from a school session. Extract every student record visible.
Return ONLY a JSON array with no extra text:
[
  { "student_name": "Ahmed Khan", "class": "7-A", "has_signature": true },
  { "student_name": "Sara Ali", "class": "6-B", "has_signature": false }
]
- class: use exactly what is written (e.g. "7-A", "Grade 6", "Class 8")
- has_signature: true if there is a signature or mark in that row, false otherwise
- If a name is illegible, do your best guess`,
  ])

  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse attendance data from image')
  return JSON.parse(jsonMatch[0]) as { student_name: string; class: string; has_signature: boolean }[]
}

export async function extractFeedback(base64Image: string, mimeType: string) {
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: base64Image,
      },
    },
    `This is a student feedback form from a school session. Extract the filled-in responses.
Return ONLY a JSON object with no extra text:
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
- understanding_level: one of "still_confused", "understand_basics", "need_more_practice"
- would_attend_more: one of "yes", "maybe", "no"
- trainer_rating: one of "excellent", "average", "poor"
- learned_something: one of "yes", "not_much", "no"
- Use null for any field left blank or unclear`,
  ])

  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse feedback data from image')
  return JSON.parse(jsonMatch[0])
}
