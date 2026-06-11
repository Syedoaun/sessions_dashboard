// Supabase / PostgREST caps a single request at ~1000 rows. Any code that
// fetches all rows to count or aggregate them in JS will silently truncate
// once the table grows past that. fetchAll pages through with .range() so the
// result is complete no matter how much data exists.
//
// Usage:
//   const rows = await fetchAll((from, to) =>
//     supabase.from('attendance').select('class').range(from, to)
//   )

type PageResult<T> = { data: T[] | null; error: { message: string } | null }

export async function fetchAll<T>(
  makeQuery: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
  }
  return rows
}
