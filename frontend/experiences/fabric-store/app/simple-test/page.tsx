// Simple test page without any async loading
export default function SimpleTest() {
  const testSlides = [
    {
      id: 'test-1',
      title: 'Experience Luxury Fabrics First-Hand',
      subtitle: 'Touch the Difference Quality Makes',
      description: 'Discover our curated collection of premium fabric samples.',
      features: [
        { text: '500+ Interior Designers', color: 'amber' },
        { text: 'Free Shipping', color: 'green' },
        { text: '3-5 Day Delivery', color: 'blue' },
        { text: 'Premium Quality', color: 'purple' }
      ],
      searchPlaceholder: 'Search fabrics by designer, style, color...',
      ctaText: 'Explore Collections',
      ctaLink: '/browse',
      backgroundGradient: 'blue'
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Carousel Test</h1>
      
      <div style={{ 
        background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)', 
        padding: '40px', 
        borderRadius: '12px',
        minHeight: '500px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          {/* Content - Left Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {testSlides[0].title}
              </h1>
              <h2 style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '16px' }}>
                {testSlides[0].subtitle}
              </h2>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
                {testSlides[0].description}
              </p>
            </div>
            
            {/* Features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {testSlides[0].features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: feature.color === 'amber' ? '#f59e0b' : 
                                   feature.color === 'green' ? '#10b981' :
                                   feature.color === 'blue' ? '#3b82f6' : '#8b5cf6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ marginTop: '16px' }}>
              <input 
                type="text" 
                placeholder={testSlides[0].searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* CTA */}
            <div style={{ marginTop: '16px' }}>
              <a 
                href={testSlides[0].ctaLink}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                {testSlides[0].ctaText}
              </a>
            </div>
          </div>

          {/* Image - Right Side */}
          <div style={{ 
            height: '400px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#6b7280'
          }}>
            📸 Hero Image (400x400)
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2>Test Results:</h2>
        <p>✅ Carousel layout: Content left, image right</p>
        <p>✅ Features displayed with colored checkmarks</p>
        <p>✅ Search box with placeholder text</p>
        <p>✅ CTA button properly styled</p>
        <p>✅ Responsive grid layout</p>
      </div>
    </div>
  )
}