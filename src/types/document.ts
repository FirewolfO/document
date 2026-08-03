export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ExampleLanguage = 'http' | 'go' | 'java' | 'python'

export interface NoticeItem {
  label: string
  value: string
}

export interface FieldDefinition {
  name: string
  location: 'Header' | 'Body' | 'Path' | 'Query' | 'Response'
  type: string
  required: boolean
  description: string
  example?: string
}

export interface ErrorDefinition {
  httpStatus: number
  code: string
  description: string
  resolution: string
}

export interface CodeExample {
  label: string
  language: string
  code: string
}

export interface EndpointDocument {
  id: string
  group: string
  title: string
  summary: string
  method: HttpMethod
  path: string
  notices: NoticeItem[]
  prerequisites: string[]
  permissionRequirement: string
  requestFields: FieldDefinition[]
  responseFields: FieldDefinition[]
  errors: ErrorDefinition[]
  examples: Record<ExampleLanguage, CodeExample>
  responseExample: string
}

export interface SystemDocument {
  id: string
  name: string
  shortName: string
  description: string
  version: string
  baseUrl: string
  endpoints: EndpointDocument[]
}
