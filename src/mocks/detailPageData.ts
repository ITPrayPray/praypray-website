import { DetailData } from "@/components/DetailPage";

export const sampleDetailData: DetailData = {
  listing_id: "123456",
  listing_name: "Golden Temple of Enlightenment",
  listing_type: "TEMPLE",
  description: "The Golden Temple of Enlightenment is a peaceful sanctuary dedicated to spiritual growth and meditation. Built in 1892, this historic site features traditional architecture and beautiful gardens. Our temple welcomes people of all backgrounds seeking inner peace and wisdom. Regular ceremonies, meditation sessions, and cultural events are held throughout the year.",
  image_urls: [
    "https://images.unsplash.com/photo-1609619385002-f40f1f52c7c1",
    "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827",
    "https://images.unsplash.com/photo-1565019011521-b0576e150457",
    "https://images.unsplash.com/photo-1618994126208-93b5e7175c58"
  ],
  location: "123 Temple Road, Harmony District",
  address: "123 Temple Road, Harmony District, Kyoto, Japan",
  lat: 35.0116,
  lng: 135.7680,
  state: { state_name: "Kyoto" },
  services: [
    { service: { service_name: "Morning Meditation Sessions", service_description: "Daily guided meditation from 6:00 AM to 7:30 AM." } },
    { service: { service_name: "Spiritual Counseling", service_description: "One-on-one sessions with experienced spiritual guides." } },
    { service: { service_name: "Cultural Ceremonies", service_description: "Traditional ceremonies on full moon days and special occasions." } },
    { service: { service_name: "Community Gatherings", service_description: "Weekly community meals and discussion groups on Sundays." } }
  ],
  religions: [
    { religion: { religion_name: "Buddhism" } },
    { religion: { religion_name: "Taoism" } }
  ],
  gods: [
    { god: { god_name: "Buddha", god_description: "The enlightened one who teaches the path to spiritual liberation." } },
    { god: { god_name: "Kwan Yin", god_description: "Goddess of mercy and compassion." } }
  ],
  tag: { tag_name: "Meditation", id: 1 },
  phone: "+81 75-123-4567",
  whatsapp: "+81751234567",
  email: "contact@goldentemple.jp",
  website: "www.goldentemple.jp",
  opening_hours: {
    monday: "09:00-18:00",
    tuesday: "09:00-18:00",
    wednesday: "09:00-18:00",
    thursday: "09:00-18:00",
    friday: "09:00-18:00",
    saturday: "10:00-16:00",
    sunday: "Closed"
  },
  reviews: [
    {
      id: "rev1",
      user_name: "Sarah W.",
      rating: 5,
      comment: "My visit to the Golden Temple was truly transformative. The morning meditation session helped me find inner peace during a stressful time in my life. The temple gardens are absolutely beautiful and the staff is very welcoming to visitors. Highly recommended for anyone seeking spiritual growth.",
      created_at: "2023-04-15T09:30:00Z"
    },
    {
      id: "rev2",
      user_name: "David L.",
      rating: 4,
      comment: "Beautiful architecture and peaceful atmosphere. The cultural ceremony I attended was very educational. Would have given 5 stars but the place was quite crowded when I visited.",
      created_at: "2023-03-22T14:15:00Z"
    },
    {
      id: "rev3",
      user_name: "Akira T.",
      rating: 5,
      comment: "As a local, I've been coming to this temple for years. The community gatherings on Sundays are wonderful for connecting with like-minded people. The spiritual counseling has been invaluable during difficult times.",
      created_at: "2023-02-10T16:45:00Z"
    }
  ]
};

export const sampleProfessionalServiceData: DetailData = {
  listing_id: "789012",
  listing_name: "Harmony Spiritual Services",
  listing_type: "PROSERVICE",
  description: "Harmony Spiritual Services offers professional guidance for individuals seeking spiritual healing and personal growth. Our experienced practitioners provide a range of services tailored to your specific needs. We combine traditional wisdom with modern approaches to support your journey toward inner harmony and well-being.",
  image_urls: [
    "https://images.unsplash.com/photo-1600618528240-fb9fc964b853",
    "https://images.unsplash.com/photo-1545389336-cf090694435e",
    "https://images.unsplash.com/photo-1604881990409-b9f36353fd86"
  ],
  location: "456 Serenity Avenue, Lotus District",
  address: "456 Serenity Avenue, Lotus District, Taipei, Taiwan",
  lat: 25.0330,
  lng: 121.5654,
  state: { state_name: "Taipei" },
  services: [
    { service: { service_name: "Spiritual Healing", service_description: "Energy healing sessions to restore balance and harmony." } },
    { service: { service_name: "Fortune Telling", service_description: "Traditional methods to provide guidance on life's path." } },
    { service: { service_name: "Aura Reading", service_description: "Insight into your spiritual energy field and chakras." } },
    { service: { service_name: "Prayer Ceremonies", service_description: "Personalized ceremonies for special occasions and life events." } },
    { service: { service_name: "Spiritual Cleansing", service_description: "Rituals to clear negative energies from spaces and individuals." } }
  ],
  religions: [
    { religion: { religion_name: "Taoism" } },
    { religion: { religion_name: "Folk Religion" } }
  ],
  gods: [
    { god: { god_name: "Guan Gong", god_description: "God of war, wealth, and protection." } }
  ],
  tag: { tag_name: "Healing", id: 2 },
  phone: "+886 2-2345-6789",
  whatsapp: "+886223456789",
  email: "info@harmonyservices.tw",
  website: "www.harmonyservices.tw",
  opening_hours: {
    monday: "10:00 AM-6:00 PM",
    tuesday: "10:00 AM-6:00 PM",
    wednesday: "10:00 AM-6:00 PM",
    thursday: "10:00 AM-6:00 PM",
    friday: "10:00 AM-8:00 PM",
    saturday: "10:00 AM-8:00 PM",
    sunday: "Closed"
  },
  reviews: [
    {
      id: "rev4",
      user_name: "Li Wei",
      rating: 5,
      comment: "Master Chen's fortune telling was incredibly accurate. The guidance I received helped me make an important career decision that I haven't regretted. The atmosphere is calming and professional.",
      created_at: "2023-05-12T11:20:00Z"
    },
    {
      id: "rev5",
      user_name: "Jessica M.",
      rating: 4,
      comment: "The spiritual cleansing ritual was a powerful experience. I felt much lighter afterward. The only reason for 4 stars instead of 5 is that it was a bit pricey, but the quality of service was excellent.",
      created_at: "2023-04-30T15:45:00Z"
    },
    {
      id: "rev6",
      user_name: "Chen Mei",
      rating: 5,
      comment: "I've been coming here for aura readings for over a year. Each session provides valuable insights, and I've noticed significant improvements in my overall well-being. Highly recommended!",
      created_at: "2023-03-18T09:10:00Z"
    },
    {
      id: "rev7",
      user_name: "Thomas K.",
      rating: 3,
      comment: "The prayer ceremony was well-conducted, but I felt somewhat rushed. The practitioners are knowledgeable, but they could improve on taking more time with each client.",
      created_at: "2023-02-25T16:30:00Z"
    }
  ]
};