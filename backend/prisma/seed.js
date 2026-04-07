// prisma/seed.js — Complete VoltStore seed data
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VoltStore database...');

  // ── Clean existing data
  await prisma.$transaction([
    prisma.commission.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.order.deleteMany(),
    prisma.partner.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.address.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.discount.deleteMany(),
    prisma.fAQ.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.supportDoc.deleteMany(),
    prisma.newsletter.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Users
  const adminHash    = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@VoltStore1', 12);
  const customerHash = await bcrypt.hash('Customer123!', 12);

  const [admin, customer] = await Promise.all([
    prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@voltstore.com',
        passwordHash: adminHash,
        firstName: 'Volt',
        lastName: 'Admin',
        role: 'ADMIN',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'test@voltstore.com',
        passwordHash: customerHash,
        firstName: 'Jane',
        lastName: 'EV Driver',
        role: 'CUSTOMER',
        emailVerified: true,
      },
    }),
  ]);

  console.log('✅ Users created');

  // ── Categories
  const [catSplitters, catChargers, catAccessories] = await Promise.all([
    prisma.category.create({
      data: {
        name: 'NEMA Splitters',
        slug: 'nema-splitters',
        description: 'Smart 240V splitters that let you share a single outlet between your EV charger and other appliances.',
        imageUrl: 'https://www.topdon.us/cdn/shop/products/PulseQ-NEMA-Splitter-30A-1000.png',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'EV Chargers',
        slug: 'ev-chargers',
        description: 'Level 2 home and portable EV chargers for every Electric Vehicle.',
        imageUrl: 'https://www.topdon.us/cdn/shop/files/PulseQACLite-1.jpg',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Cables, adapters, and accessories for your EV charging setup.',
        sortOrder: 3,
      },
    }),
  ]);

  console.log('✅ Categories created');

  // ── Products
  // 1. PulseQ NEMA Splitter
  const nema30 = await prisma.product.create({
    data: {
      name: 'PulseQ NEMA Splitter 30A',
      slug: 'pulseq-nema-splitter-30a',
      sku: 'VS-NEMA-30A',
      description: `The PulseQ NEMA Splitter 30A is the ultimate solution for sharing your existing 240V NEMA 14-30 outlet between your EV charger and household appliances like dryers or air conditioners.

No panel upgrades. No electricians. Just plug and charge.

**Smart Power Sharing**: Power is distributed with left-side priority. When total output exceeds 30A, left port gets priority. Below 30A, both ports share equally.

**How it works**: Simply plug the splitter into your existing NEMA 14-30 outlet. Connect your EV charger to the left port and your appliance to the right port. The smart load-sharing controller automatically detects and manages which device is drawing power — giving priority to the left port when both are active.

**Compatible with**: Tesla, Ford F-150 Lightning, Rivian, Chevy Bolt, Hyundai Ioniq, Kia EV6, BMW, Audi e-tron, and any J1772-compatible EV charger.`,
      shortDescription: 'Smart 240V splitter for NEMA 14-30 outlets. Share power between EV charger and dryer with zero panel upgrades.',
      categoryId: catSplitters.id,
      basePrice: 177.00,
      compareAtPrice: 352.00,
      isFeatured: true,
      isActive: true,
      weight: 2.5,
      tags: ['splitter', 'nema', '30a', 'ev', 'charger', 'dryer'],
      specifications: {
        inputPlug: 'NEMA 14-30P (Male)',
        outputPlug: '2x NEMA 14-30R (Female)',
        maxCurrent: '30A',
        voltage: '240V',
        maxPower: '7.2kW',
        certifications: 'ETL, FCC',
        warranty: '2 Years',
        dimensions: '7.1 × 4.3 × 3.5 in',
        weight: '2.5 lbs',
        operatingTemp: '-4°F to 104°F (-20°C to 40°C)',
        protections: ['Overload', 'Short Circuit', 'Overheating'],
        indicator: 'Real-time LED status indicators',
      },
      useCases: [
        {
          title: 'Dryer + EV Charger',
          description: 'Share your dryer outlet with your Level 2 EV charger. The smart controller gives priority to whichever device is actively running.',
          icon: 'dryer',
        },
        {
          title: 'Dual EV Charging',
          description: 'Charge two EVs from a single 30A outlet. Perfect for two-EV households — one car charges fully, then the other takes over automatically.',
          icon: 'car',
        },
        {
          title: 'EV + Air Conditioner',
          description: 'Run your garage air conditioner and charge your EV from the same circuit without overloading.',
          icon: 'ac',
        },
      ],
      metaTitle: 'PulseQ NEMA 14-30 Splitter 30A — EV Charger & Dryer Power Sharing',
      metaDescription: 'Share your NEMA 14-30 outlet between your EV charger and dryer. No panel upgrade needed. Smart load-sharing, ETL certified.',
    },
  });

  // Add images for NEMA 30A
  await prisma.productImage.createMany({
    data: [
      { productId: nema30.id, url: 'https://www.topdon.us/cdn/shop/products/PulseQ-NEMA-Splitter-30A-1000.png', altText: 'PulseQ NEMA Splitter 30A — Front View', position: 0, isPrimary: true },
      { productId: nema30.id, url: 'https://www.topdon.us/cdn/shop/files/01.jpg', altText: 'PulseQ NEMA Splitter 30A — Side View', position: 1 },
      { productId: nema30.id, url: 'https://www.topdon.us/cdn/shop/files/02-_1_2.jpg', altText: 'PulseQ NEMA Splitter 30A — Installed', position: 2 },
      { productId: nema30.id, url: 'https://www.topdon.us/cdn/shop/files/03.jpg', altText: 'PulseQ NEMA Splitter 30A — Use Case', position: 3 },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: nema30.id, name: '30A — NEMA 14-30', sku: 'VS-NEMA-30A-STD', price: 177.00, compareAtPrice: 352.00, inventory: 150, options: { amperage: '30A', connector: 'NEMA 14-30', ports: '2x NEMA 14-30R' }, sortOrder: 0 },
    ],
  });

  // 2. PulseQ NEMA Splitter 50A
  const nema50 = await prisma.product.create({
    data: {
      name: 'PulseQ NEMA Splitter 50A',
      slug: 'pulseq-nema-splitter-50a',
      sku: 'VS-NEMA-50A',
      description: `The PulseQ NEMA Splitter 50A delivers even more power-sharing capacity on your NEMA 14-50 outlet. With up to 50 amps available, you can simultaneously charge two EVs or share between an EV charger and a high-draw appliance at full speed.

**Left-side priority output**: When total load exceeds 50A, the left port gets full priority. Below 50A, both ports share power equally for simultaneous use.

**Ideal for**: Tesla Wall Connector, EVSE chargers, RV hookups, welders, and any 50A appliance.

The industry's most powerful smart splitter — built for serious EV households.`,
      shortDescription: 'Smart 240V splitter for NEMA 14-50 outlets. Share 50A between two EVs or EV + appliance with intelligent load management.',
      categoryId: catSplitters.id,
      basePrice: 199.00,
      compareAtPrice: 399.00,
      isFeatured: true,
      isActive: true,
      weight: 2.8,
      tags: ['splitter', 'nema', '50a', 'ev', 'charger', 'tesla'],
      specifications: {
        inputPlug: 'NEMA 14-50P (Male)',
        outputPlug: '2x NEMA 14-50R (Female)',
        maxCurrent: '50A',
        voltage: '240V',
        maxPower: '12kW',
        certifications: 'ETL, FCC',
        warranty: '2 Years',
        dimensions: '7.5 × 4.5 × 3.7 in',
        weight: '2.8 lbs',
        operatingTemp: '-4°F to 104°F (-20°C to 40°C)',
        protections: ['Overload', 'Short Circuit', 'Overheating'],
        indicator: 'Real-time LED status indicators',
      },
      useCases: [
        {
          title: 'Dual EV Charging (50A)',
          description: 'Charge two EVs from a single 50A outlet. Maximum speed charging for both vehicles with automatic load balancing.',
          icon: 'car',
        },
        {
          title: 'Tesla + Another EV',
          description: 'Plug in your Tesla and another EV simultaneously. Left port gets priority when both are charging.',
          icon: 'lightning',
        },
        {
          title: 'EV + RV / Generator',
          description: 'Share your 50A outdoor outlet between your EV and RV, power tools, or generator without overloading your circuit.',
          icon: 'home',
        },
      ],
      metaTitle: 'PulseQ NEMA 14-50 Splitter 50A — Dual EV Charging on One Outlet',
      metaDescription: 'Share your NEMA 14-50 50A outlet between two EVs or EV + appliance. Smart load sharing, ETL certified, no rewiring needed.',
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: nema50.id, url: 'https://www.topdon.us/cdn/shop/files/04.jpg', altText: 'PulseQ NEMA Splitter 50A — Front View', position: 0, isPrimary: true },
      { productId: nema50.id, url: 'https://www.topdon.us/cdn/shop/files/05.jpg', altText: 'PulseQ NEMA Splitter 50A — In Use', position: 1 },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: nema50.id, name: '50A — NEMA 14-50', sku: 'VS-NEMA-50A-STD', price: 199.00, compareAtPrice: 399.00, inventory: 120, options: { amperage: '50A', connector: 'NEMA 14-50', ports: '2x NEMA 14-50R' }, sortOrder: 0 },
    ],
  });

  // 3. PulseQ AC Lite 48A (NACS/Tesla)
  const acLite48 = await prisma.product.create({
    data: {
      name: 'PulseQ AC Lite 48A — NACS/Tesla',
      slug: 'pulseq-ac-lite-48a-nacs-tesla',
      sku: 'VS-ACLITE-48A-NACS',
      description: `The PulseQ AC Lite 48A is our most powerful Level 2 EV charger, featuring the native NACS/SAE J3400 Tesla connector. Charge at up to 48A / 11.5kW — delivering up to 44 miles of range per hour.

**App-Controlled Charging**: Schedule charging for off-peak electricity rates, set charge limits, and monitor energy usage in real-time via the companion app.

**Voice Control**: Works with Amazon Alexa and Google Assistant.

**RFID Access Control**: Secure your charger with RFID card authentication — perfect for shared spaces.

**Safety**: IP65 weatherproof rating. Built-in overload, overcurrent, short circuit and ground fault protection. UL listed.

**25-foot cable** provides flexibility to reach any parking spot in your garage or driveway.

Compatible with ALL NACS/SAE J3400 native Tesla vehicles (Model S, 3, X, Y, Cybertruck) — no adapter needed.`,
      shortDescription: '48A Level 2 EV Charger with native Tesla NACS connector, app control, voice activation, 25ft cable. Max speed charging.',
      categoryId: catChargers.id,
      basePrice: 450.00,
      compareAtPrice: 897.00,
      isFeatured: true,
      isActive: true,
      weight: 6.5,
      tags: ['charger', 'level2', '48a', 'nacs', 'tesla', 'app', 'rfid'],
      specifications: {
        connector: 'SAE J3400 / NACS / Tesla',
        maxCurrent: '48A',
        maxPower: '11.5kW',
        voltage: '240V',
        cableLength: '25 ft (7.6m)',
        inputPlug: 'NEMA 14-50 (hardwire option available)',
        connectivity: 'Wi-Fi, Bluetooth',
        voiceAssistant: 'Amazon Alexa, Google Assistant',
        rfid: 'Yes — RFID card included',
        weatherRating: 'IP65',
        certifications: 'UL Listed, FCC, ETL',
        warranty: '3 Years',
        app: 'iOS & Android',
        operatingTemp: '-22°F to 122°F (-30°C to 50°C)',
        dimensions: '11.4 × 6.7 × 4.1 in',
        weight: '6.5 lbs',
        chargingSpeed: 'Up to 44 miles/hr (at 48A)',
      },
      metaTitle: 'PulseQ AC Lite 48A NACS Tesla Charger — Level 2 Home EV Charger',
      metaDescription: 'Charge your Tesla at 48A with native NACS connector. App control, RFID, voice activation, IP65. 25ft cable. $450.',
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: acLite48.id, url: 'https://www.topdon.us/cdn/shop/files/topdon-pulseq-ac-lite-48a-level-2-ev-charger-front-view.jpg', altText: 'PulseQ AC Lite 48A NACS Tesla Charger', position: 0, isPrimary: true },
      { productId: acLite48.id, url: 'https://www.topdon.us/cdn/shop/files/PulseQACLite-1.jpg', altText: 'PulseQ AC Lite 48A — Side Profile', position: 1 },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: acLite48.id, name: '48A — NACS/Tesla Connector, 25ft', sku: 'VS-ACLITE-48A-NACS-25', price: 450.00, compareAtPrice: 897.00, inventory: 80, options: { amperage: '48A', connector: 'NACS/Tesla', cable: '25ft' }, sortOrder: 0 },
    ],
  });

  // 4. PulseQ AC Lite 40A (J1772)
  const acLite40 = await prisma.product.create({
    data: {
      name: 'PulseQ AC Lite 40A — J1772',
      slug: 'pulseq-ac-lite-40a-j1772',
      sku: 'VS-ACLITE-40A',
      description: `The PulseQ AC Lite 40A Level 2 EV Charger brings smart charging to every J1772-compatible vehicle. At 40A output, you'll add up to 30 miles of range per hour — turning overnight charging into a full battery.

**Plug-and-Play**: Simply plug into any NEMA 14-50 outlet — no electrician or hardwiring needed.

**Smart App Control**: Schedule charging windows to take advantage of off-peak electricity rates. Monitor usage, set charge limits, receive alerts.

**RFID Authentication**: Secure your charger from unauthorized use.

**Voice Commands**: Works with Alexa and Google Assistant.

**Universal Compatibility**: J1772 connector works with ALL non-Tesla EVs and most Tesla vehicles with the included adapter.`,
      shortDescription: '40A Level 2 EV Charger with J1772 connector. Plug-and-play NEMA 14-50, app control, RFID, 16ft cable.',
      categoryId: catChargers.id,
      basePrice: 351.00,
      compareAtPrice: 700.00,
      isFeatured: false,
      isActive: true,
      weight: 5.5,
      tags: ['charger', 'level2', '40a', 'j1772', 'app', 'rfid', 'plug-and-play'],
      specifications: {
        connector: 'SAE J1772 (Type 1)',
        maxCurrent: '40A',
        maxPower: '9.6kW',
        voltage: '240V',
        cableLength: '16 ft (4.9m)',
        inputPlug: 'NEMA 14-50',
        connectivity: 'Wi-Fi, Bluetooth',
        voiceAssistant: 'Amazon Alexa, Google Assistant',
        rfid: 'Yes — RFID card included',
        weatherRating: 'IP65',
        certifications: 'UL Listed, FCC',
        warranty: '3 Years',
        app: 'iOS & Android',
        chargingSpeed: 'Up to 30 miles/hr (at 40A)',
        dimensions: '10.8 × 6.3 × 3.9 in',
        weight: '5.5 lbs',
      },
      metaTitle: 'PulseQ AC Lite 40A J1772 EV Charger — Level 2 Home Charging Station',
      metaDescription: 'Level 2 home EV charger with J1772 connector. Plug into NEMA 14-50, app control, RFID. Charge at 40A / 30mi/hr.',
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: acLite40.id, url: 'https://www.topdon.us/cdn/shop/files/PulseQACLite-1.jpg', altText: 'PulseQ AC Lite 40A — Front View', position: 0, isPrimary: true },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: acLite40.id, name: '40A — J1772, 16ft, NEMA 14-50 Plug', sku: 'VS-ACLITE-40A-16', price: 351.00, compareAtPrice: 700.00, inventory: 100, options: { amperage: '40A', connector: 'J1772', cable: '16ft', plug: 'NEMA 14-50' }, sortOrder: 0 },
    ],
  });

  // 5. PulseQ AC Home 40A
  const acHome = await prisma.product.create({
    data: {
      name: 'PulseQ AC Home 40A — Hardwired',
      slug: 'pulseq-ac-home-40a',
      sku: 'VS-ACHOME-40A',
      description: `The PulseQ AC Home is the premium hardwired Level 2 EV charger for permanent garage installation. UL certified and built for 24/7 outdoor use with IP54 weatherproofing.

**Sleek Wall-Mount Design**: Clean, compact unit that blends seamlessly with any home aesthetic.

**Smart App Control**: Charge scheduling, usage monitoring, and remote control from your smartphone.

**RFID Lock**: White-list authorized RFID cards to control who can charge.

**Perfect for permanent installation**: Works with any licensed electrician — designed to be hardwired to your home's panel for maximum reliability.`,
      shortDescription: '40A hardwired Level 2 EV Charger with J1772. Permanent wall installation, UL certified, app + RFID control.',
      categoryId: catChargers.id,
      basePrice: 368.00,
      compareAtPrice: 734.00,
      isFeatured: false,
      isActive: true,
      weight: 4.8,
      tags: ['charger', 'level2', '40a', 'j1772', 'hardwired', 'wall-mount', 'ul'],
      specifications: {
        connector: 'SAE J1772 (Type 1)',
        maxCurrent: '40A',
        maxPower: '9.6kW',
        voltage: '240V',
        cableLength: '18 ft (5.5m)',
        installation: 'Hardwired',
        connectivity: 'Wi-Fi',
        rfid: 'Yes',
        weatherRating: 'IP54',
        certifications: 'UL Listed',
        warranty: '3 Years',
        dimensions: '9.8 × 5.9 × 3.5 in',
        weight: '4.8 lbs',
        chargingSpeed: 'Up to 28 miles/hr (at 40A)',
      },
      metaTitle: 'PulseQ AC Home 40A Hardwired EV Charger — UL Certified Level 2',
      metaDescription: 'Hardwired 40A Level 2 home EV charger. J1772, UL certified, app + RFID, 18ft cable. Permanent installation.',
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: acHome.id, url: 'https://www.topdon.us/cdn/shop/products/PulseQACHome.png', altText: 'PulseQ AC Home 40A', position: 0, isPrimary: true },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: acHome.id, name: '40A — J1772, 18ft, Hardwired', sku: 'VS-ACHOME-40A-18', price: 368.00, compareAtPrice: 734.00, inventory: 60, options: { amperage: '40A', connector: 'J1772', cable: '18ft', installation: 'Hardwired' }, sortOrder: 0 },
    ],
  });

  // 6. PulseQ AC Portable Charger
  const portable = await prisma.product.create({
    data: {
      name: 'PulseQ AC Portable EV Charger',
      slug: 'pulseq-ac-portable-ev-charger',
      sku: 'VS-ACPORT',
      description: `The most versatile portable EV charger for home and travel. Supports multiple amperage settings (8A, 10A, 16A, 24A, 32A) to work with any outlet — from a standard 120V outlet for Level 1 charging to a 240V outlet for Level 2 speed.

**Level 1 + Level 2**: Adjustable current from 8A up to 32A. At home use your NEMA 14-50 for Level 2 (7.7kW). While traveling, plug into any standard 120V outlet for emergency charging.

**Carry bag included**: Compact carry bag makes it easy to throw in the trunk.

**Scheduled Charging**: Set charging windows via the companion app to charge at off-peak rates.

**Real-Time Monitoring**: Track energy usage, charging time, and estimated range added.`,
      shortDescription: 'Portable EV charger supporting Level 1 (120V) and Level 2 (240V). Adjustable 8A–32A. App control. Multiple plug adapters.',
      categoryId: catChargers.id,
      basePrice: 184.00,
      compareAtPrice: 366.00,
      isFeatured: true,
      isActive: true,
      weight: 3.2,
      tags: ['charger', 'portable', 'level1', 'level2', 'j1772', 'travel'],
      specifications: {
        connector: 'SAE J1772 (Type 1)',
        currentRange: '8A – 32A (adjustable)',
        maxPower: '7.7kW (at 32A/240V)',
        cableLength: '20 ft (6m)',
        plugOptions: 'NEMA 5-15 (120V), NEMA 14-50 (240V) adapters',
        display: 'LED display',
        protection: 'IP54',
        certifications: 'UL Listed',
        warranty: '2 Years',
        dimensions: '9.1 × 5.5 × 2.8 in',
        weight: '3.2 lbs',
      },
      metaTitle: 'PulseQ Portable EV Charger — Level 1 & Level 2, Adjustable Amp, J1772',
      metaDescription: 'Portable EV charger for home and travel. Level 1 (120V) and Level 2 (240V). Adjustable 8-32A. App control. From $184.',
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: portable.id, url: 'https://www.topdon.us/cdn/shop/files/PulseQACPortable_3.7K_C7_US-1_2.jpg', altText: 'PulseQ AC Portable EV Charger', position: 0, isPrimary: true },
    ],
  });

  await prisma.productVariant.createMany({
    data: [
      { productId: portable.id, name: '16A — NEMA 5-15 + 14-50 adapters', sku: 'VS-ACPORT-16A', price: 184.00, compareAtPrice: 280.00, inventory: 200, options: { maxAmperage: '16A', cable: '20ft', plugs: 'NEMA 5-15 + NEMA 14-50' }, sortOrder: 0 },
      { productId: portable.id, name: '32A — NEMA 14-50, 20ft', sku: 'VS-ACPORT-32A', price: 229.00, compareAtPrice: 366.00, inventory: 150, options: { maxAmperage: '32A', cable: '20ft', plugs: 'NEMA 14-50' }, sortOrder: 1 },
    ],
  });

  console.log('✅ Products created');

  // ── Discounts
  await prisma.discount.createMany({
    data: [
      { code: 'WELCOME10', description: 'Welcome 10% off first order', type: 'PERCENTAGE', value: 10, maxUses: 1000, isActive: true },
      { code: 'COMEBACK10', description: 'Abandoned cart recovery 10% off', type: 'PERCENTAGE', value: 10, maxUses: null, isActive: true },
      { code: 'EV20', description: '$20 off orders over $200', type: 'FIXED_AMOUNT', value: 20, minOrderAmount: 200, isActive: true },
      { code: 'FREESHIP', description: 'Free shipping on any order', type: 'FREE_SHIPPING', value: 0, isActive: true },
      { code: 'PARTNER15', description: 'Partner 15% off', type: 'PERCENTAGE', value: 15, isActive: true },
    ],
  });

  console.log('✅ Discounts created');

  // ── FAQs
  await prisma.fAQ.createMany({
    data: [
      // General
      { question: 'What is the PulseQ NEMA Splitter?', answer: 'The PulseQ NEMA Splitter is a smart 240V power sharing device that lets you connect two devices (like an EV charger and a dryer) to a single NEMA 14-30 or 14-50 outlet. It uses intelligent load-sharing to manage power between devices automatically.', category: 'Splitters', sortOrder: 1 },
      { question: 'Do I need an electrician to install the NEMA Splitter?', answer: 'No! The NEMA Splitter is completely plug-and-play. Simply plug it into your existing 240V outlet — no tools, no wiring, no permits required. Installation takes less than 2 minutes.', category: 'Splitters', sortOrder: 2 },
      { question: 'Is it safe to use the splitter?', answer: 'Yes. The PulseQ NEMA Splitter is ETL certified and FCC certified. It includes overload protection, short circuit protection, and overheating protection to keep your devices and home safe.', category: 'Splitters', sortOrder: 3 },
      { question: 'Which EVs are compatible with your chargers?', answer: 'Our J1772 chargers are compatible with all non-Tesla EVs and most Tesla vehicles with the included adapter. The NACS/Tesla version (48A) works natively with all Tesla vehicles without any adapter.', category: 'Chargers', sortOrder: 4 },
      { question: 'What is Level 2 charging?', answer: 'Level 2 EV charging uses a 240V power source (same as your dryer or oven) to deliver 10-44 miles of range per hour — compared to about 3-5 miles/hr on a standard 120V outlet. It\'s the recommended home charging method for most EV drivers.', category: 'Chargers', sortOrder: 5 },
      { question: 'Do you offer free shipping?', answer: 'Yes! We offer free shipping on all orders over $45 within the United States. Expedited and international shipping options are available at checkout.', category: 'Shipping', sortOrder: 6 },
      { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied for any reason, return the item in its original packaging for a full refund. We also provide a 2-3 year manufacturer warranty on all products.', category: 'Returns', sortOrder: 7 },
      { question: 'How does the partner/affiliate program work?', answer: 'Our partner program lets you earn commissions on every sale you refer. Apply to become a partner, receive your unique referral link, and earn 10-15% on every qualifying purchase made through your link. Monthly payouts via PayPal.', category: 'Partners', sortOrder: 8 },
      { question: 'Can I charge two EVs at the same time with the 30A splitter?', answer: 'Yes, but with shared power. Below 30A total draw, both ports receive equal power simultaneously. When one device pulls the full 30A, the other pauses automatically. Left port always gets priority.', category: 'Splitters', sortOrder: 9 },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), Apple Pay, Google Pay, and PayPal via Stripe.', category: 'Payments', sortOrder: 10 },
    ],
  });

  console.log('✅ FAQs created');

  // ── Blog Posts
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'EV Charging at Home: The Complete Guide for 2026',
        slug: 'ev-charging-at-home-complete-guide-2026',
        excerpt: 'Everything you need to know about charging your electric vehicle at home — from Level 1 to Level 2, panel upgrades, and smart splitters.',
        content: `# EV Charging at Home: The Complete 2026 Guide

Charging your EV at home is the most convenient and cost-effective way to keep your battery full. This guide covers everything from basic Level 1 charging to installing a full Level 2 EVSE station.

## Level 1 vs Level 2 Charging

**Level 1 (120V)** — Every EV comes with a Level 1 "trickle charger" that plugs into any standard household outlet. It delivers about 3-5 miles of range per hour. For most drivers, Level 1 alone is too slow unless you drive fewer than 30 miles per day.

**Level 2 (240V)** — Uses the same voltage as your dryer or oven. Delivers 10-44 miles of range per hour depending on the charger amp rating. This is the gold standard for home EV charging.

## Do You Need a Panel Upgrade?

Most homes built after 1990 have a 200A main panel, which is sufficient for a 30A or 40A EV charger. However, if your panel is already heavily loaded, your electrician may recommend a panel upgrade.

**The smart alternative**: A NEMA Splitter lets you share an existing 240V outlet (like your dryer) with your EV charger — completely eliminating the need for a panel upgrade or new circuit. Our customers save an average of $2,000+ using this approach.

## Choosing the Right Charger

For most EV drivers, a 40A Level 2 charger is perfect — adding 30 miles per hour of charging. If you drive a Tesla or high-range EV and want maximum speed, go with our 48A NACS charger.

## Smart Charging Features to Look For

- **Scheduling**: Charge during off-peak hours to save on electricity bills
- **Energy monitoring**: Track your exact charging costs
- **App control**: Start/stop charging remotely
- **RFID**: Secure your charger from unauthorized use

Ready to upgrade your home charging setup? [Shop our EV chargers →](/shop)`,
        authorName: 'VoltStore Team',
        tags: ['ev-charging', 'home', 'level-2', 'guide'],
        status: 'PUBLISHED',
        publishedAt: new Date('2026-03-15'),
      },
      {
        title: 'NEMA Splitter vs Panel Upgrade: Which Is Right for You?',
        slug: 'nema-splitter-vs-panel-upgrade',
        excerpt: 'Should you install a NEMA splitter or upgrade your electrical panel? We break down costs, complexity, and the best solution for most EV drivers.',
        content: `# NEMA Splitter vs Panel Upgrade for EV Charging

When you get your first EV and want Level 2 charging at home, you face a choice: install a new dedicated circuit (potentially requiring a panel upgrade) or use a NEMA splitter to share an existing outlet.

## The Traditional Route: New Circuit + Panel Upgrade

Installing a dedicated 240V circuit for your EV charger is the "textbook" approach. Here's what it typically involves:

- **Cost**: $500–$3,000+ depending on panel location, wiring runs, and whether your panel needs upgrading
- **Panel upgrade**: If your panel is full or undersized, add $2,000–$8,000
- **Permits**: Required in most municipalities
- **Timeline**: 1-3 business days minimum, often weeks for permits

**Total typical cost**: $1,500–$10,000

## The Smart Alternative: NEMA Splitter

A NEMA splitter costs $177–$199 and takes 2 minutes to install. You plug it into your existing dryer outlet, connect your EV charger, and you're done.

**How it works**: The splitter monitors power draw on both ports. When your dryer runs, it has priority. When the dryer is off, your EV charges at full speed. Both ports can share power simultaneously when total draw allows.

**Total cost**: $177–$199 (80-90% savings vs new circuit)

## When to Choose Each Option

**Choose a NEMA Splitter if:**
- You have an existing NEMA 14-30 or 14-50 outlet nearby
- You want to save $1,000-$10,000
- You need charging up and running today
- You rent your home (no permits, no rewiring)

**Choose a dedicated circuit if:**
- You plan to charge 2+ EVs simultaneously at full speed 24/7
- You're doing a major home renovation anyway
- You have specific commercial installation requirements

For 80%+ of residential EV drivers, a NEMA Splitter is the smarter, faster, and more affordable choice.

[Shop NEMA Splitters →](/shop?category=nema-splitters)`,
        authorName: 'VoltStore Team',
        tags: ['nema-splitter', 'panel-upgrade', 'ev-charging', 'cost'],
        status: 'PUBLISHED',
        publishedAt: new Date('2026-02-20'),
      },
    ],
  });

  console.log('✅ Blog posts created');

  // ── Support Docs
  await prisma.supportDoc.createMany({
    data: [
      { title: 'Getting Started — PulseQ NEMA Splitter', slug: 'getting-started-nema-splitter', content: `# Getting Started with Your PulseQ NEMA Splitter\n\n## What's in the Box\n- PulseQ NEMA Splitter\n- Outlet bracket\n- Quick start guide\n\n## Installation (2 minutes)\n1. Locate your existing NEMA 14-30 or 14-50 outlet\n2. Plug the splitter into the outlet (male plug)\n3. Connect your EV charger to the LEFT port\n4. Connect your appliance to the RIGHT port\n5. Check the LED indicators — green means ready\n\n## LED Status Indicators\n- **Green solid**: Power available, no device drawing current\n- **Green blinking**: Device charging normally\n- **Yellow**: Shared load mode (both ports in use, below limit)\n- **Red**: Overload — unplug one device\n\n## Priority Logic\n- Left port always has priority when total draw > rated amperage\n- Both ports share equally when total load is below the rated limit`, category: 'NEMA Splitter', sortOrder: 1 },
      { title: 'Getting Started — PulseQ AC Charger', slug: 'getting-started-ac-charger', content: `# Getting Started with Your PulseQ AC Charger\n\n## Installation\n\n### Plug-in Models (NEMA 14-50)\n1. Plug charger into NEMA 14-50 outlet\n2. Download the PulseQ app (iOS/Android)\n3. Follow the in-app setup wizard\n\n### Hardwired Models\nContact a licensed electrician for hardwired installation.\n\n## App Setup\n1. Download the app and create an account\n2. Tap "Add Device" and follow pairing instructions\n3. Connect to your home Wi-Fi\n4. Configure your charging schedule\n\n## RFID Card Programming\n1. In the app, go to Settings → RFID Cards\n2. Tap "Add Card" and hold your card near the reader\n3. The charger will beep twice to confirm`, category: 'EV Chargers', sortOrder: 2 },
    ],
  });

  // ── Settings
  await prisma.setting.createMany({
    data: [
      { key: 'store_name', value: 'VoltStore', group: 'general' },
      { key: 'store_email', value: 'hello@voltstore.com', group: 'general' },
      { key: 'store_phone', value: '1-800-VOLT-EV', group: 'general' },
      { key: 'free_shipping_threshold', value: '45', group: 'shipping' },
      { key: 'standard_shipping_rate', value: '9.99', group: 'shipping' },
      { key: 'tax_rate', value: '0.08', group: 'taxes' },
      { key: 'default_commission_rate', value: '10', group: 'partners' },
    ],
  });

  // ── Seed reviews for products
  await prisma.review.createMany({
    data: [
      { productId: nema30.id, userId: customer.id, rating: 5, title: 'Exactly what I needed!', body: 'Bought my Tesla Model 3 and realized my panel couldn\'t handle another circuit. This splitter was the perfect solution. Works flawlessly with my dryer and EV charger. Installation took 2 minutes.', status: 'APPROVED', isVerified: true },
      { productId: acLite48.id, userId: customer.id, rating: 5, title: 'Best Tesla charger I\'ve owned', body: 'Native NACS connector is a game changer — no adapter needed! The app is excellent, scheduling off-peak charging has already saved me money. Built quality is top notch.', status: 'APPROVED', isVerified: true },
    ],
  });

  console.log('✅ Reviews created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log(`  Admin: ${process.env.ADMIN_EMAIL || 'admin@voltstore.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@VoltStore1'}`);
  console.log('  Customer: test@voltstore.com / Customer123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
