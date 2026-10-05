import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { COLOR_SCHEMES, COMMON_FEATURES, FONT_VIBES, LAYOUT_STYLES, type Customization } from '@/lib/prompts';
import { cn } from '@/lib/utils';

interface Props {
  value: Customization;
  onChange: (value: Customization) => void;
  onSubmit: () => void;
  busy: boolean;
  /** Features the chosen idea already has, so we don't offer duplicates. */
  existingFeatures: string[];
}

function OptionGrid<T extends { id: string; name: string; description: string }>({
  options,
  selected,
  onSelect,
  name,
}: {
  options: readonly T[];
  selected: string;
  onSelect: (id: T['id']) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-2 lg:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={selected === o.id}
          onClick={() => onSelect(o.id)}
          className={cn(
            'rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
            selected === o.id ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="text-sm font-medium text-gray-900">{o.name}</div>
          <div className="text-xs text-gray-500">{o.description}</div>
        </button>
      ))}
    </div>
  );
}

export function IdeaCustomizationForm({ value, onChange, onSubmit, busy, existingFeatures }: Props) {
  const set = <K extends keyof Customization>(key: K, v: Customization[K]) => onChange({ ...value, [key]: v });
  const lowerExisting = existingFeatures.map((f) => f.toLowerCase());
  const extras = COMMON_FEATURES.filter((f) => !lowerExisting.includes(f.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Look and feel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Colours</Label>
            <div role="radiogroup" aria-label="Colours" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_SCHEMES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={value.colorScheme === s.id}
                  onClick={() => set('colorScheme', s.id)}
                  className={cn(
                    'rounded-lg border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                    value.colorScheme === s.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={cn('mb-2 h-6 rounded bg-gradient-to-r', s.swatch)} />
                  <div className="text-sm font-medium">{s.name}</div>
                </button>
              ))}
            </div>
            {value.colorScheme === 'custom' && (
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="color"
                  aria-label="Pick a colour"
                  value={/^#[0-9a-f]{6}$/i.test(value.customHexColor) ? value.customHexColor : '#7c3aed'}
                  onChange={(e) => set('customHexColor', e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={value.customHexColor}
                  onChange={(e) => set('customHexColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="w-32 font-mono"
                  aria-label="Hex colour"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Layout</Label>
            <OptionGrid name="Layout" options={LAYOUT_STYLES} selected={value.layoutStyle} onSelect={(id) => set('layoutStyle', id)} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fonts</Label>
            <OptionGrid name="Fonts" options={FONT_VIBES} selected={value.fontVibe} onSelect={(id) => set('fontVibe', id)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add common features</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {extras.map((f) => {
                const id = `feature-${f.replace(/\W+/g, '-')}`;
                return (
                  <div key={f} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={value.extraFeatures.includes(f)}
                      onCheckedChange={(checked) =>
                        set('extraFeatures', checked ? [...value.extraFeatures, f] : value.extraFeatures.filter((x) => x !== f))
                      }
                    />
                    <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                      {f}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-features" className="text-sm font-medium">
              Anything else?
            </Label>
            <Textarea
              id="custom-features"
              placeholder="e.g. drag-and-drop to reorder items, export to PDF"
              value={value.customFeatures}
              onChange={(e) => set('customFeatures', e.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-flow" className="text-sm font-medium">
              Main user journey
            </Label>
            <Textarea
              id="user-flow"
              placeholder="e.g. Sign up → create a profile → add items → share with friends"
              value={value.userFlow}
              onChange={(e) => set('userFlow', e.target.value)}
              maxLength={1000}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSubmit} disabled={busy} size="lg" className="h-auto w-full bg-purple-600 py-4 text-base text-white hover:bg-purple-700">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Writing your prompts… (about 20–40 seconds)
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate my prompts
          </>
        )}
      </Button>
    </div>
  );
}
