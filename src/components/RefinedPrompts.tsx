import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, ExternalLink, Code, Database, Sparkles } from 'lucide-react'

interface RefinedPromptsProps {
  prompts: string
  selectedIdea: any
  onStartOver: () => void
  onSaveAsProject?: () => void
}

export function RefinedPrompts({ prompts, selectedIdea, onStartOver, onSaveAsProject }: RefinedPromptsProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  // Parse the prompts to separate Lovable and Cursor sections
  const parsedPrompts = parsePrompts(prompts)

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Ready to Build
        </Badge>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Your Custom Development Prompts
        </h2>
        <p className="text-gray-600">
          Professional prompts for "{selectedIdea?.title}" tailored to your preferences
        </p>
      </div>

      {/* Prompts Tabs */}
      <Tabs defaultValue="lovable" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lovable" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Lovable.dev (Frontend)
          </TabsTrigger>
          <TabsTrigger value="cursor" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cursor (Backend)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lovable">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  Lovable.dev Frontend Prompt
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(parsedPrompts.lovable, 'lovable')}
                    className="flex items-center gap-2"
                  >
                    {copiedStates.lovable ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedStates.lovable ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://lovable.dev', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Lovable
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border">
                {parsedPrompts.lovable}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">How to use this prompt:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Copy the prompt above</li>
                  <li>Go to Lovable.dev and create a new project</li>
                  <li>Paste this prompt into the project description</li>
                  <li>Let Lovable generate your frontend code</li>
                  <li>Sync to GitHub when ready</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursor">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Cursor Backend Prompt
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(parsedPrompts.cursor, 'cursor')}
                    className="flex items-center gap-2"
                  >
                    {copiedStates.cursor ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedStates.cursor ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://cursor.sh', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get Cursor
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border">
                {parsedPrompts.cursor}
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">How to use this prompt:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800">
                  <li>Download and install Cursor AI</li>
                  <li>Clone your Lovable project from GitHub</li>
                  <li>Open the project in Cursor</li>
                  <li>Use this prompt to add backend functionality</li>
                  <li>Follow the step-by-step implementation guide</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold mb-4 text-center">Next Steps</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Code className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">1. Build Frontend</h4>
              <p className="text-sm text-gray-600">Use the Lovable prompt to create your app's frontend interface</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Add Backend</h4>
              <p className="text-sm text-gray-600">Use the Cursor prompt to add backend functionality and database</p>
            </div>
          </div>
          <div className="text-center mt-6 space-y-3">
            {onSaveAsProject && (
              <Button
                onClick={onSaveAsProject}
                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
              >
                Save as Project & Continue Building
              </Button>
            )}
            <div>
              <Button
                variant="outline"
                onClick={onStartOver}
                className="text-gray-600 hover:text-gray-800"
              >
                Start Over with New Idea
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function parsePrompts(prompts: string): { lovable: string; cursor: string } {
  const sections = prompts.split('## ')
  
  let lovable = ''
  let cursor = ''
  
  for (const section of sections) {
    if (section.toLowerCase().includes('lovable')) {
      lovable = section.replace(/^LOVABLE\.DEV PROMPT\s*\n?/, '').trim()
    } else if (section.toLowerCase().includes('cursor')) {
      cursor = section.replace(/^CURSOR PROMPT\s*\n?/, '').trim()
    }
  }
  
  // Fallback if parsing fails
  if (!lovable && !cursor) {
    const parts = prompts.split('\n\n')
    lovable = parts.slice(0, Math.ceil(parts.length / 2)).join('\n\n')
    cursor = parts.slice(Math.ceil(parts.length / 2)).join('\n\n')
  }
  
  return { lovable, cursor }
} 