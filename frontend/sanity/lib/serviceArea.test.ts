import {describe, it, expect} from 'vitest'

import {serviceAreaGatePasses, type ServiceAreaGateInput} from './serviceArea'

// The gate decides whether a service×area combo page is launchable; the catch-all
// route 404s (noindex) when it fails, so this is the doorway-page guard. A passing
// doc needs: ≥120-char local intro, real service+area refs, ≥2 projects matching
// BOTH that area and service, and at least one local testimonial or FAQ.
const intro = 'x'.repeat(120)
const pass: ServiceAreaGateInput = {
  localIntro: intro,
  service: {_id: 'svc1'},
  area: {_id: 'area1'},
  projects: [
    {area: {_id: 'area1'}, services: [{_id: 'svc1'}]},
    {area: {_id: 'area1'}, services: [{_id: 'svc1'}, {_id: 'svc2'}]},
  ],
  localTestimonial: {quote: 'Great job'},
}

describe('serviceAreaGatePasses', () => {
  it('passes a complete, genuinely-launchable combo', () => {
    expect(serviceAreaGatePasses(pass)).toBe(true)
  })
  it('passes with a FAQ instead of a testimonial', () => {
    expect(serviceAreaGatePasses({...pass, localTestimonial: null, localFaqs: [{q: 'a'}]})).toBe(true)
  })

  it('fails on null/undefined', () => {
    expect(serviceAreaGatePasses(null)).toBe(false)
    expect(serviceAreaGatePasses(undefined)).toBe(false)
  })
  it('fails on a thin intro (<120 chars)', () => {
    expect(serviceAreaGatePasses({...pass, localIntro: 'too short'})).toBe(false)
  })
  it('fails without resolved service/area refs', () => {
    expect(serviceAreaGatePasses({...pass, service: null})).toBe(false)
    expect(serviceAreaGatePasses({...pass, area: {_id: null}})).toBe(false)
  })
  it('fails with fewer than 2 matching projects', () => {
    expect(serviceAreaGatePasses({...pass, projects: [pass!.projects![0]]})).toBe(false)
    // projects in a different area do not count
    expect(
      serviceAreaGatePasses({
        ...pass,
        projects: [
          {area: {_id: 'other'}, services: [{_id: 'svc1'}]},
          {area: {_id: 'other'}, services: [{_id: 'svc1'}]},
        ],
      }),
    ).toBe(false)
  })
  it('fails with neither testimonial nor FAQ', () => {
    expect(serviceAreaGatePasses({...pass, localTestimonial: null, localFaqs: []})).toBe(false)
  })
})
