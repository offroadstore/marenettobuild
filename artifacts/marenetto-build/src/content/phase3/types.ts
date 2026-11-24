export type Topic = 'access' | 'stone' | 'damp' | 'roof' | 'remote' | 'outdoor' | 'rental' | 'purchase' | 'surfaces' | 'winter';
export type Setting = 'coast' | 'hill' | 'mountain';
export type ServiceLink = 'services' | 'abroad' | 'process' | 'request' | 'furniture';

export type Phase3Copy = {
  ui: {
    zonesNav: string; furnitureNav: string; aiNav: string; footerHeading: string;
    zonesKicker: string; zonesTitle: string; zonesIntro: string; zonesNote: string;
    zonesMetaTitle: string; zonesMetaDescription: string;
    focusHeading: string; checklistHeading: string; checklistIntro: string;
    servicesHeading: string; contactHeading: string; contactText: string;
    call: string; write: string; whatsapp: string; addressLabel: string; request: string;
    otherZones: string; backToZones: string; localityNote: string; whatsappMessage: (place: string) => string;
    placeDescription: (place: string, focus: string) => string;
    placeIntro: (place: string) => string;
  };
  settings: Record<Setting, { label: string; text: string }>;
  topics: Record<Topic, { h1: string; text: string; checks: [string, string, string] }>;
  serviceLabels: Record<ServiceLink, string>;
  furniture: {
    metaTitle: string; metaDescription: string; kicker: string; title: string; intro: string; cta: string;
    worldwide: string; blocks: [string, string][]; materialsHeading: string; materials: [string, string][];
    stepsHeading: string; steps: [string, string][]; photosHeading: string; photosText: string; photoSlot: string;
    faqHeading: string; faq: [string, string][]; contactHeading: string; contactText: string; mailSubject: string;
  };
  ai: {
    metaTitle: string; metaDescription: string; kicker: string; title: string; intro: string;
    sections: [string, string][]; privacyText: string; privacyLink: string; contactHeading: string; contactText: string; mailSubject: string;
  };
};
