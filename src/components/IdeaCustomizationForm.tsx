import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ChevronDown, ChevronUp, Palette, Layout, Zap, ArrowRight, Sparkles } from 'lucide-react'

interface CustomizationData {
  colorScheme: string
  layoutStyle: string
  fontVibe: string
  features: string[]
  customFeatures: string
  userFlow: string
  customHexColor?: string
}

interface IdeaCustomizationFormProps {
  selectedIdea: any
  onSubmit: (customization: CustomizationData) => void
  isLoading?: boolean
}

export function IdeaCustomizationForm({ selectedIdea, onSubmit, isLoading }: IdeaCustomizationFormProps) {
  const [customization, setCustomization] = useState<CustomizationData>({
    colorScheme: 'modern-purple',
    layoutStyle: 'dashboard',
    fontVibe: 'modern',
    features: [],
    customFeatures: '',
    userFlow: '',
    customHexColor: ''
  })
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const colorSchemes = [
    { id: 'modern-purple', name: 'Modern Purple', preview: 'bg-gradient-to-r from-purple-600 to-purple-700' },
    { id: 'ocean-blue', name: 'Ocean Blue', preview: 'bg-gradient-to-r from-blue-600 to-blue-700' },
    { id: 'forest-green', name: 'Forest Green', preview: 'bg-gradient-to-r from-green-600 to-green-700' },
    { id: 'sunset-orange', name: 'Sunset Orange', preview: 'bg-gradient-to-r from-orange-600 to-red-600' },
    { id: 'monochrome', name: 'Monochrome', preview: 'bg-gradient-to-r from-gray-600 to-gray-800' },
    { id: 'custom', name: 'Custom', preview: 'bg-gradient-to-r from-pink-500 to-violet-500' }
  ]

  const layoutStyles = [
    { id: 'dashboard', name: 'Dashboard', description: 'Admin-style with sidebar navigation' },
    { id: 'mobile-first', name: 'Mobile-First', description: 'Optimized for mobile experience' },
    { id: 'minimalist', name: 'Minimalist', description: 'Clean, simple interface' },
    { id: 'social-feed', name: 'Social Feed', description: 'Instagram/Twitter-like layout' },
    { id: 'grid-gallery', name: 'Grid Gallery', description: 'Pinterest-style grid layout' }
  ]

  const fontVibes = [
    { id: 'modern', name: 'Modern', description: 'Clean, contemporary fonts' },
    { id: 'playful', name: 'Playful', description: 'Friendly, rounded fonts' },
    { id: 'formal', name: 'Formal', description: 'Professional, serif fonts' },
    { id: 'techy', name: 'Techy', description: 'Monospace, developer-style' }
  ]

  const commonFeatures = [
    'User Authentication',
    'Profile Management',
    'Real-time Updates',
    'Push Notifications',
    'File Upload/Storage',
    'Search Functionality',
    'Analytics Dashboard',
    'Social Features',
    'Payment Integration',
    'Offline Support',
    'Dark Mode',
    'Multi-language Support'
  ]

  const handleFeatureToggle = (feature: string) => {
    setCustomization(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleSubmit = () => {
    onSubmit(customization)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Customize Your App
        </Badge>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Make It Yours
        </h2>
        <p className="text-gray-600">
          Personalize your "{selectedIdea?.title}" app with your preferred style and features
        </p>
      </div>

      {/* Basic Customization */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Design Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Scheme */}
          <div>
            <Label className="text-base font-medium mb-3 block">Color Scheme</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {colorSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                    customization.colorScheme === scheme.id
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCustomization(prev => ({ ...prev, colorScheme: scheme.id }))}
                >
                  <div className={`h-12 rounded-t-lg ${scheme.preview}`} />
                  <div className="p-3">
                    <p className="font-medium text-sm">{scheme.name}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {customization.colorScheme === 'custom' && (
              <div className="mt-4">
                <Label htmlFor="custom-color" className="text-sm font-medium">Custom Color (HEX)</Label>
                <Input
                  id="custom-color"
                  type="text"
                  placeholder="#6366f1"
                  value={customization.customHexColor}
                  onChange={(e) => setCustomization(prev => ({ ...prev, customHexColor: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Layout Style */}
          <div>
            <Label className="text-base font-medium mb-3 block">Layout Style</Label>
            <RadioGroup
              value={customization.layoutStyle}
              onValueChange={(value) => setCustomization(prev => ({ ...prev, layoutStyle: value }))}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {layoutStyles.map((style) => (
                <div key={style.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={style.id} id={style.id} />
                  <Label htmlFor={style.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Font Vibe */}
          <div>
            <Label className="text-base font-medium mb-3 block">Font Style</Label>
            <RadioGroup
              value={customization.fontVibe}
              onValueChange={(value) => setCustomization(prev => ({ ...prev, fontVibe: value }))}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {fontVibes.map((font) => (
                <div key={font.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={font.id} id={font.id} />
                  <Label htmlFor={font.id} className="cursor-pointer">
                    <div className="font-medium text-sm">{font.name}</div>
                    <div className="text-xs text-gray-500">{font.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card className="border-0 shadow-lg">
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Advanced Options
                </div>
                {isAdvancedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Common Features */}
              <div>
                <Label className="text-base font-medium mb-3 block">Core Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={customization.features.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <Label htmlFor={feature} className="text-sm cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Features */}
              <div>
                <Label htmlFor="custom-features" className="text-base font-medium mb-2 block">
                  Custom Features
                </Label>
                <Textarea
                  id="custom-features"
                  placeholder="Describe any specific features you want (e.g., 'swipe-to-delete lists', 'drag-and-drop interface')"
                  value={customization.customFeatures}
                  onChange={(e) => setCustomization(prev => ({ ...prev, customFeatures: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              {/* User Flow */}
              <div>
                <Label htmlFor="user-flow" className="text-base font-medium mb-2 block">
                  Main User Journey
                </Label>
                <Textarea
                  id="user-flow"
                  placeholder="Describe the main flow users will take (e.g., 'Sign up → Create profile → Add items → Share with friends')"
                  value={customization.userFlow}
                  onChange={(e) => setCustomization(prev => ({ ...prev, userFlow: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 h-auto text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Refining Your App...
            </>
          ) : (
            <>
              Generate Custom Prompts
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 