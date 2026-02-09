const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g

export function resolveVariables(text: string, variables: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (match, name: string) => {
    return name in variables ? variables[name] : match
  })
}

export function resolveRequestVariables(
  request: { url: string; headers: Record<string, string>; body?: string },
  variables: Record<string, string>
): { url: string; headers: Record<string, string>; body?: string } {
  const url = resolveVariables(request.url, variables)

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key] = resolveVariables(value, variables)
  }

  const body = request.body ? resolveVariables(request.body, variables) : undefined

  return { url, headers, body }
}
