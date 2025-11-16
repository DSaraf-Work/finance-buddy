/**
 * Design System Example Component
 * 
 * This component demonstrates how to use the global design system.
 * Use this as a reference when building new components.
 */

export default function DesignSystemExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        Design System Example
      </h1>
      <p className="text-text-secondary mb-8">
        This page demonstrates the global design system in action.
      </p>

      {/* Colors Section */}
      <section className="card">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Colors</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Background Colors */}
          <div>
            <div className="h-20 bg-bg-primary rounded-lg border border-border mb-2"></div>
            <p className="text-sm text-text-muted">bg-primary</p>
          </div>
          <div>
            <div className="h-20 bg-bg-secondary rounded-lg border border-border mb-2"></div>
            <p className="text-sm text-text-muted">bg-secondary</p>
          </div>
          <div>
            <div className="h-20 bg-bg-elevated rounded-lg border border-border mb-2"></div>
            <p className="text-sm text-text-muted">bg-elevated</p>
          </div>
          <div>
            <div className="h-20 bg-brand-primary rounded-lg mb-2"></div>
            <p className="text-sm text-text-muted">brand-primary</p>
          </div>
          
          {/* Accent Colors */}
          <div>
            <div className="h-20 bg-accent-pink rounded-lg mb-2"></div>
            <p className="text-sm text-text-muted">accent-pink</p>
          </div>
          <div>
            <div className="h-20 bg-accent-cyan rounded-lg mb-2"></div>
            <p className="text-sm text-text-muted">accent-cyan</p>
          </div>
          <div>
            <div className="h-20 bg-accent-emerald rounded-lg mb-2"></div>
            <p className="text-sm text-text-muted">accent-emerald</p>
          </div>
          <div>
            <div className="h-20 bg-accent-amber rounded-lg mb-2"></div>
            <p className="text-sm text-text-muted">accent-amber</p>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="card">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Typography</h2>
        
        <div className="space-y-3">
          <p className="text-4xl font-bold text-text-primary">Heading 1 - 4xl Bold</p>
          <p className="text-3xl font-semibold text-text-primary">Heading 2 - 3xl Semibold</p>
          <p className="text-2xl font-semibold text-text-primary">Heading 3 - 2xl Semibold</p>
          <p className="text-xl font-medium text-text-primary">Heading 4 - xl Medium</p>
          <p className="text-base text-text-primary">Body text - base Regular</p>
          <p className="text-sm text-text-secondary">Secondary text - sm</p>
          <p className="text-xs text-text-muted">Muted text - xs</p>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="card">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Buttons</h2>
        
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-primary" disabled>Disabled Button</button>
          
          <button className="bg-success hover:bg-success/80 text-white px-4 py-2 rounded-lg transition-colors">
            Success Button
          </button>
          <button className="bg-warning hover:bg-warning/80 text-white px-4 py-2 rounded-lg transition-colors">
            Warning Button
          </button>
          <button className="bg-error hover:bg-error/80 text-white px-4 py-2 rounded-lg transition-colors">
            Error Button
          </button>
        </div>
      </section>

      {/* Form Elements Section */}
      <section className="card">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Form Elements</h2>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Input Field
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter text..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Textarea
            </label>
            <textarea 
              className="input-field" 
              rows={4}
              placeholder="Enter description..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select
            </label>
            <select className="input-field">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Card Title</h3>
            <p className="text-text-secondary">This is a card with default styling from the design system.</p>
          </div>
          
          <div className="bg-bg-secondary border border-brand-primary rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-brand-primary mb-2">Highlighted Card</h3>
            <p className="text-text-secondary">This card uses brand colors for emphasis.</p>
          </div>
          
          <div className="bg-bg-elevated border border-border-light rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Elevated Card</h3>
            <p className="text-text-secondary">This card uses elevated background color.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

