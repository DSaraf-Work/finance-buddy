import { Layout } from '@/components/Layout';
import { useTheme } from '@/contexts/ThemeContext';
import { colorSchemes, ColorScheme } from '@/styles/design-tokens';

export default function ThemeShowcase() {
  const { colorScheme, setColorScheme } = useTheme();

  const themeDescriptions: Record<ColorScheme, string> = {
    darkPurple: 'Professional and modern purple theme perfect for finance apps and dashboards',
    darkBlue: 'Corporate blue theme ideal for business tools and enterprise applications',
    light: 'Clean light theme optimized for daytime use and accessibility',
    darkGreen: 'Nature-inspired green theme great for eco-friendly and wellness apps',
    lightBlue: 'Sky blue theme with cloud aesthetics for communication and cloud services',
    yellow: 'Warm amber/gold theme perfect for creative apps and inviting interfaces',
    monotone: 'Grayscale theme for minimal distraction and focused work environments',
    mattePurple: 'Sophisticated matte purple with soft, desaturated tones for elegant, calming interfaces',
  };

  const themeIcons: Record<ColorScheme, string> = {
    darkPurple: '🌙',
    darkBlue: '💼',
    light: '☀️',
    darkGreen: '🌿',
    lightBlue: '☁️',
    yellow: '⭐',
    monotone: '⚫',
    mattePurple: '💜',
  };

  return (
    <Layout title="Theme Showcase" description="Explore all available color schemes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Theme Showcase
          </h1>
          <p className="text-lg text-text-secondary">
            Explore all 7 available color schemes. Click any theme card to activate it.
          </p>
        </div>

        {/* Current Theme Info */}
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{themeIcons[colorScheme]}</div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Current Theme: {colorSchemes[colorScheme].name}
              </h2>
              <p className="text-text-secondary mt-1">
                {themeDescriptions[colorScheme]}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(colorSchemes) as ColorScheme[]).map((scheme) => {
            const colors = colorSchemes[scheme].colors;
            const isActive = colorScheme === scheme;

            return (
              <button
                key={scheme}
                onClick={() => setColorScheme(scheme)}
                className={`text-left transition-all duration-300 rounded-xl p-6 border-2 ${
                  isActive
                    ? 'border-brand-primary shadow-lg scale-105'
                    : 'border-border hover:border-border-light hover:scale-102'
                }`}
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                {/* Theme Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{themeIcons[scheme]}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {colorSchemes[scheme].name}
                      </h3>
                      {isActive && (
                        <span className="text-xs text-brand-primary font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-text-secondary mb-4">
                  {themeDescriptions[scheme]}
                </p>

                {/* Color Palette Preview */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border border-border"
                      style={{ backgroundColor: colors.bgPrimary }}
                      title="Background Primary"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border border-border"
                      style={{ backgroundColor: colors.bgSecondary }}
                      title="Background Secondary"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border border-border"
                      style={{ backgroundColor: colors.bgElevated }}
                      title="Background Elevated"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: colors.brandPrimary }}
                      title="Brand Primary"
                    />
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: colors.accentEmerald }}
                      title="Accent Emerald"
                    />
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: colors.accentCyan }}
                      title="Accent Cyan"
                    />
                  </div>
                </div>

                {/* Primary Color */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Primary Color</span>
                    <code className="text-xs font-mono text-text-secondary">
                      {colors.brandPrimary}
                    </code>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Usage Example */}
        <div className="mt-12 card">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            How to Use Themes
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Programmatically
              </h3>
              <pre className="bg-bg-elevated p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-text-secondary font-mono">
{`import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { setColorScheme } = useTheme();
  
  return (
    <button onClick={() => setColorScheme('darkGreen')}>
      Switch to Dark Green
    </button>
  );
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

