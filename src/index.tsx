import './index.css';

import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

const SHEET_API = 'https://script.google.com/macros/s/AKfycbwUnD7ek2k6iGxqKM6Jw0fXViPAK5MP9fNOY4oP4gSEvnVSEJd267SqU8OsSiVIGhGX/exec';

// --- TYPE DEFINITIONS ---
type Tab = 'home' | 'profile' | 'schedule' | 'ideas' | 'evaluation' | 'konsultasi' | 'referensi' | 'members';

interface Post {
    id: number;
    imageUrl: string;
    likes: number;
    caption: string;
}

interface BaseProfile {
    id: number;
    role: 'parent' | 'teacher';
    name: string;
    age: number;
    avatar: string;
    bio: string;
    location: string;
    followers: number;
    following: number;
    posts: Post[];
}

interface ParentProfileData extends BaseProfile {
    role: 'parent';
        children: {name: string; age: number; specialNeeds: string}[];
}

interface TeacherProfileData extends BaseProfile {
    role: 'teacher';
    background: string;
    experience: string;
        isOnline: boolean;
    specialization: string;
}

type UserProfile = ParentProfileData | TeacherProfileData;

interface PlayIdea {
    id: number;
    title: string;
    description: string;
    category: 'Sensori' | 'Tradisional' | 'Sains' | 'Keluarga' | 'Seni' | 'Fisik';
    emoji: string;
    youtubeUrl: string;
    pinterestUrl: string;
}

interface PlayLocation {
    id: number;
    name: string;
    city: string;
    address: string;
    facilities: string[];
    hasPool: boolean;
    imageUrl: string;
    mapsUrl: string;
}

interface ScheduleItem {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    type: 'playdate' | 'konsultasi' | 'evaluasi';
}

// --- MOCK DATA ---
const avatars = [
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Mimi&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Coco&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Leo&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Max&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Zoe&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Finn&backgroundColor=fcf6bd'
];

const mockPosts: Post[] = [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=400&fit=crop', likes: 24, caption: 'Bermain pasir hari ini!' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop', likes: 12, caption: 'Melukis dengan jari seru sekali.' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400&h=400&fit=crop', likes: 56, caption: 'Kegiatan sensory di taman.' },
];

const categories = ['Sensori', 'Tradisional', 'Sains', 'Keluarga', 'Seni', 'Fisik'] as const;

// FIX 2: Konten Ide Bermain yang nyata dan bermakna
const realIdeaTitles: Record<string, {title: string; desc: string}[]> = {
    'Sensori': [
        {title: 'Bermain Playdough Warna-Warni', desc: 'Stimulasi motorik halus dan kreativitas melalui adonan playdough buatan sendiri dengan pewarna alami.'},
        {title: 'Sensory Bin Beras Pelangi', desc: 'Eksplorasi tekstur menggunakan beras berwarna, sendok, dan wadah untuk melatih koordinasi tangan.'},
        {title: 'Finger Painting di Plastik', desc: 'Melukis dengan jari di atas plastik ziplock berisi cat, aman dan minim kotor untuk si kecil.'},
        {title: 'Water Beads Exploration', desc: 'Bermain water beads untuk melatih sensori taktil, mengenal warna, dan konsep besar-kecil.'},
        {title: 'Slime Aman dari Tepung', desc: 'Membuat slime dari tepung kanji dan air, aman dimainkan sambil belajar tekstur kenyal.'},
    ],
    'Tradisional': [
        {title: 'Congklak Bersama Keluarga', desc: 'Permainan tradisional congklak melatih berhitung, strategi, dan kesabaran anak.'},
        {title: 'Petak Umpet di Halaman', desc: 'Permainan klasik yang melatih kemampuan sosial, berhitung, dan kesabaran menunggu.'},
        {title: 'Lompat Tali Berirama', desc: 'Bermain lompat tali sambil bernyanyi, melatih koordinasi, ritme, dan ketahanan fisik.'},
        {title: 'Engklek/Sondah Kreatif', desc: 'Bermain engklek dengan modifikasi modern, melatih keseimbangan dan mengenal angka.'},
        {title: 'Bakiak Kayu Tim', desc: 'Bermain bakiak berkelompok melatih kekompakan, komunikasi, dan koordinasi kaki.'},
    ],
    'Sains': [
        {title: 'Eksperimen Gunung Meletus', desc: 'Membuat gunung berapi mini dari tanah liat dan reaksi soda kue + cuka untuk belajar sains.'},
        {title: 'Menanam Kacang Hijau', desc: 'Mengamati pertumbuhan tanaman dari biji, belajar siklus hidup dan tanggung jawab merawat.'},
        {title: 'Percobaan Warna Pelangi', desc: 'Mencampur warna primer dengan air untuk menghasilkan warna sekunder, belajar teori warna.'},
        {title: 'Magnet Explorer', desc: 'Eksplorasi benda magnetik dan non-magnetik di rumah untuk belajar konsep fisika sederhana.'},
        {title: 'Hujan Buatan dalam Toples', desc: 'Membuat simulasi hujan menggunakan toples, air, busa cukur, dan pewarna makanan.'},
    ],
    'Keluarga': [
        {title: 'Masak Bersama Si Kecil', desc: 'Memasak makanan sederhana bersama anak, belajar mengukur, menghitung, dan kerja sama.'},
        {title: 'Family Movie Night Tematik', desc: 'Menonton film edukasi bersama dengan diskusi dan kegiatan terkait tema film.'},
        {title: 'Berkebun Mini di Pot', desc: 'Menanam sayuran atau bunga di pot bersama keluarga, belajar tanggung jawab dan alam.'},
        {title: 'Board Game Malam Keluarga', desc: 'Bermain board game bersama untuk melatih berpikir strategis dan sportivitas.'},
        {title: 'Picnic Indoor Seru', desc: 'Piknik di dalam rumah dengan tikar dan makanan buatan sendiri, quality time keluarga.'},
    ],
    'Seni': [
        {title: 'Kolase dari Daun Kering', desc: 'Membuat kolase seni dari daun kering dan bunga, melatih kreativitas dan motorik halus.'},
        {title: 'Membuat Boneka dari Kaos Kaki', desc: 'Kreasi boneka tangan dari kaos kaki bekas, lalu bermain peran dan bercerita.'},
        {title: 'Stamp Art Sayuran', desc: 'Membuat cap seni menggunakan potongan sayuran dan cat, eksplorasi bentuk dan warna.'},
        {title: 'Origami Hewan Sederhana', desc: 'Melipat kertas menjadi bentuk hewan, melatih kesabaran dan instruksi bertahap.'},
        {title: 'Musik dari Barang Bekas', desc: 'Membuat alat musik sederhana dari botol, kaleng, dan karet untuk eksplorasi bunyi.'},
    ],
    'Fisik': [
        {title: 'Obstacle Course Rumahan', desc: 'Membuat lintasan rintangan dari bantal dan kardus di rumah untuk melatih motorik kasar.'},
        {title: 'Yoga Anak Ceria', desc: 'Gerakan yoga sederhana dengan nama hewan, melatih kelenturan dan fokus anak.'},
        {title: 'Balap Karung Mini', desc: 'Lomba balap karung di halaman, melatih keseimbangan dan ketahanan fisik anak.'},
        {title: 'Dance Freeze Game', desc: 'Menari saat musik menyala dan freeze saat berhenti, melatih kontrol tubuh dan pendengaran.'},
        {title: 'Bowling Botol Bekas', desc: 'Bermain bowling menggunakan botol bekas dan bola, melatih koordinasi mata-tangan.'},
    ],
};

const PlayIdeasData: PlayIdea[] = [];
let ideaId = 1;
categories.forEach(cat => {
    const ideas = realIdeaTitles[cat] || [];
    ideas.forEach(idea => {
        PlayIdeasData.push({
            id: ideaId++,
            category: cat,
            emoji: cat === 'Sensori' ? '🧩' : cat === 'Tradisional' ? '🎾' : cat === 'Sains' ? '🔬' : cat === 'Keluarga' ? '👨‍👩‍👧' : cat === 'Seni' ? '🎨' : '🏃',
            title: idea.title,
            description: idea.desc,
            youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(idea.title)}`,
            pinterestUrl: `https://id.pinterest.com/search/pins/?q=${encodeURIComponent(idea.title)}`
        });
    });
});

// FIX 6: Referensi lokasi dengan gambar placeholder yang valid
const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Bekasi', 'Tangerang', 'Depok', 'Bali', 'Medan'];
const locationImages = [
    'https://images.unsplash.com/photo-1566454419290-57a64afe21b8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=400&h=300&fit=crop',
];
const realLocationNames = ['Taman Bermain Inklusi', 'Playground Edukatif', 'Arena Sensori Kids', 'Fun Park Family', 'Splash Water Play', 'Creative Corner', 'Little Explorer Park', 'Happy Kids Zone'];
const rawLocations: PlayLocation[] = [];
for (let i = 1; i <= 24; i++) {
    const city = cities[i % cities.length];
    const isPool = i % 4 === 0;
    rawLocations.push({
        id: i,
        name: `${realLocationNames[i % realLocationNames.length]} ${city}`,
        city: city,
        address: `Jl. Inklusi No. ${i}, ${city}`,
        facilities: isPool ? ['Kolam Renang', 'Parkir', 'Kafe'] : ['Playground', 'Edukasi', 'AC'],
        hasPool: isPool,
        imageUrl: locationImages[i % locationImages.length],
        mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Playground kids in ${city}`)}`
    });
}
const PlayLocationsData = rawLocations;

// Format tanggal Indonesia
const formatTanggalID = (dateStr: string) => {
    const d = new Date(dateStr);
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

// FIX 5: Data Jadwal
const mockSchedule: ScheduleItem[] = [
    { id: 1, title: 'Playdate Sensori Bersama', date: '2026-03-08', time: '09:00', location: 'Taman Bermain Inklusi Jakarta', type: 'playdate' },
    { id: 2, title: 'Konsultasi dengan Ibu Sarah', date: '2026-03-10', time: '14:00', location: 'Online via Chat', type: 'konsultasi' },
    { id: 3, title: 'Evaluasi Pertemuan ke-3', date: '2026-03-12', time: '10:00', location: 'Arena Sensori Kids Bandung', type: 'evaluasi' },
    { id: 4, title: 'Playdate Tradisional Games', date: '2026-03-15', time: '08:30', location: 'Happy Kids Zone Bekasi', type: 'playdate' },
    { id: 5, title: 'Konsultasi Bapak Ahmad', date: '2026-03-18', time: '15:00', location: 'Online via Chat', type: 'konsultasi' },
    { id: 6, title: 'Playdate Sains Explorer', date: '2026-03-22', time: '09:00', location: 'Creative Corner Tangerang', type: 'playdate' },
];

const initialTeachers: TeacherProfileData[] = [
    { id: 101, role: 'teacher', name: 'Ibu Sarah, S.Pd', age: 32, avatar: avatars[0], bio: 'Ahli intervensi dini dan stimulasi sensori.', location: 'Jakarta', followers: 120, following: 80, posts: [], background: 'S1 Pendidikan Luar Biasa', experience: '8 Tahun', isOnline: true, specialization: 'Intervensi Dini & Sensori' },
    { id: 102, role: 'teacher', name: 'Bapak Ahmad, M.Psi', age: 35, avatar: avatars[1], bio: 'Psikolog perkembangan anak khusus inklusi.', location: 'Bandung', followers: 250, following: 150, posts: [], background: 'S2 Psikologi Anak', experience: '10 Tahun', isOnline: false, specialization: 'Psikologi Perkembangan Anak' }
];

const initialMembers: ParentProfileData[] = [
    { id: 201, role: 'parent', name: 'Mama Arka', age: 28, avatar: avatars[2], bio: 'Suka berbagi ide bermain sensori di rumah.', location: 'Jakarta Selatan', followers: 45, following: 30, posts: [], children: [{name: 'Arka', age: 4, specialNeeds: 'Sensori'}] },

    { id: 202, role: 'parent', name: 'Papa Kenzie', age: 34, avatar: avatars[3], bio: 'Ayah yang aktif mendampingi ananda bermain.', location: 'Bekasi', followers: 20, following: 15, posts: [], children: [{name: 'Kenzie', age: 5, specialNeeds: 'ADHD'}] },
    { id: 203, role: 'parent', name: 'Bunda Naura', age: 30, avatar: avatars[4], bio: 'Mari berteman dan berbagi pengalaman inklusi.', location: 'Tangerang', followers: 88, following: 120, posts: [], children: [{name: 'Naura', age: 3, specialNeeds: 'Speech Delay'}] }
];

// --- ICONS ---
const IconHome = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>);
const IconSound = () => (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z"/></svg>);
const IconUser = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>);
const IconBulb = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>);
const IconClipboard = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>);
const IconCalendar = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
const IconKonsultasi = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>);
const IconBack = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>);
const IconGrid = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>);
const IconCheck = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>);
const IconMap = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>);
const IconUsers = () => (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>);
const IconCamera = () => (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>);
const IconSend = () => (<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>);
const IconYoutube = () => (<svg width="14" height="14" fill="red" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);
const IconPinterest = () => (<svg width="14" height="14" fill="#E60023" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>);
const IconLogout = () => (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>);
const IconSparkle = () => (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>);

// --- LOGO ---
const HyplayLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ background: 'var(--navy-blue)', color: 'white', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>H</div>
        <span style={{ fontWeight: '800', color: 'var(--navy-blue)', fontSize: '1.2rem' }}>hyplay<span style={{ color: 'var(--brand-pink)' }}>.id</span></span>
    </div>
);

// --- REGISTRATION SCREEN ---
const RegistrationScreen = ({ onRegister }: { onRegister: (user: UserProfile) => void }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [role, setRole] = useState<'parent' | 'teacher'>('parent');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !age || !location) { alert('Harap lengkapi semua data!'); return; }
        setIsLoading(true);
        let newUser: UserProfile;
        if (role === 'parent') {
            newUser = { id: Date.now(), role: 'parent', name, age: parseInt(age), location, avatar: avatars[Math.floor(Math.random() * avatars.length)], bio: 'Orang tua yang aktif mendampingi ananda', followers: 0, following: 0, posts: [], children: [] };
        } else {
            newUser = { id: Date.now(), role: 'teacher', name, age: parseInt(age), location, avatar: avatars[Math.floor(Math.random() * avatars.length)], bio: 'Guru berdedikasi untuk pendidikan inklusif', followers: 0, following: 0, posts: [], background: 'Pendidikan Inklusi', experience: 'Baru Bergabung', isOnline: false, specialization: 'Umum' };
        }
        fetch(SHEET_API, { method: 'POST', body: JSON.stringify({ action: 'register', user: { name, age: parseInt(age), role, location } }), mode: 'no-cors' }).catch(() => {});
        setTimeout(() => { setIsLoading(false); onRegister(newUser); }, 800);
    };

    return (
        <div className="screen-container" style={{ padding: '2rem 1.5rem' }}>
            <HyplayLogo />
            <h2 style={{ textAlign: 'center', color: 'var(--navy-blue)', margin: '1rem 0' }}>Daftar hyplay.id</h2>
            <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
                <div className="form-group"><label className="form-label">Nama Lengkap</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda..." className="form-input" /></div>
                <div className="form-group"><label className="form-label">Umur</label><input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Umur Anda..." className="form-input" /></div>
                <div className="form-group"><label className="form-label" style={{ color: 'var(--brand-pink)' }}>Peran</label><div style={{ display: 'flex', gap: '0.5rem' }}><button type="button" onClick={() => setRole('parent')} className="profile-btn" style={{ flex: 1, background: role === 'parent' ? 'var(--brand-pink)' : '#f0f2f5', color: role === 'parent' ? 'white' : '#666' }}>Orang Tua</button><button type="button" onClick={() => setRole('teacher')} className="profile-btn" style={{ flex: 1, background: role === 'teacher' ? 'var(--brand-pink)' : '#f0f2f5', color: role === 'teacher' ? 'white' : '#666' }}>Guru</button></div></div>
                <div className="form-group"><label className="form-label">Lokasi</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Contoh: Jakarta Selatan" className="form-input" /></div>
                <button type="submit" className="profile-btn primary" disabled={isLoading}>{isLoading ? 'Mendaftar...' : 'Daftar & Masuk'}</button>
            </form>
        </div>
    );
};

// --- EVALUATION SCREEN ---
const evaluationIndicators = [
    { id: 1, text: 'Respons terhadap sentuhan atau berbagai tekstur alat main.', category: 'Sensori' },
    { id: 2, text: 'Fokus visual pada objek atau kegiatan yang sedang berlangsung.', category: 'Sensori' },
    { id: 3, text: 'Kemampuan membedakan suara instruksi di lingkungan bermain.', category: 'Sensori' },
    { id: 4, text: 'Keseimbangan tubuh saat bergerak atau berpindah tempat.', category: 'Sensori' },
    { id: 5, text: 'Kesadaran posisi tubuh saat duduk atau berdiri.', category: 'Sensori' },
    { id: 6, text: 'Koordinasi mata dan tangan dalam menyelesaikan tugas bermain.', category: 'Sensori' },
    { id: 7, text: 'Keseimbangan saat posisi diam (duduk atau berdiri statis).', category: 'Motorik Kasar' },
    { id: 8, text: 'Stabilitas dan kelenturan saat berjalan atau berlari.', category: 'Motorik Kasar' },
    { id: 9, text: 'Kemampuan melompat atau berjingkat dengan koordinasi baik.', category: 'Motorik Kasar' },
    { id: 10, text: 'Kekuatan otot lengan saat melempar atau menangkap objek.', category: 'Motorik Kasar' },
    { id: 11, text: 'Daya tahan fisik selama durasi sesi bermain.', category: 'Motorik Kasar' },
    { id: 12, text: 'Postur tubuh yang tegak dan terjaga selama beraktivitas.', category: 'Motorik Kasar' },
    { id: 13, text: 'Mempertahankan kontak mata saat berinteraksi dengan orang lain.', category: 'Sosial' },
    { id: 14, text: 'Kemampuan mengikuti instruksi sederhana dari guru atau orang tua.', category: 'Sosial' },
    { id: 15, text: 'Kesabaran dalam menunggu giliran bermain.', category: 'Sosial' },
    { id: 16, text: 'Kemauan berbagi alat main atau bekerja sama dengan teman.', category: 'Sosial' },
    { id: 17, text: 'Mengekspresikan emosi secara wajar dan terkendali.', category: 'Sosial' },
    { id: 18, text: 'Kemampuan memulai percakapan atau interaksi sederhana.', category: 'Sosial' },
];

const EvaluationScreen = () => {
    const [sessionCount, setSessionCount] = useState<1|3|7>(1);
    const [childName, setChildName] = useState('');
    const [childAge, setChildAge] = useState('');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (indicatorId: number, value: number) => { setAnswers(prev => ({ ...prev, [indicatorId]: value })); };
    const isComplete = Object.keys(answers).length === evaluationIndicators.length && childName && childAge;

    const generateNarrative = () => {
        const cats = ['Sensori', 'Motorik Kasar', 'Sosial'];
        const summary: Record<string, {total:number;count:number}> = {};
        cats.forEach(cat => summary[cat] = { total: 0, count: 0 });
        evaluationIndicators.forEach(ind => { const score = answers[ind.id] || 0; summary[ind.category].total += score; summary[ind.category].count += 1; });
        let narrative = `Berdasarkan hasil evaluasi pertemuan ke-${sessionCount}, ananda ${childName} (${childAge} tahun) menunjukkan perkembangan yang bervariasi. `;
        cats.forEach(cat => {
            const avg = summary[cat].total / summary[cat].count;
            if (avg >= 4) narrative += `Di aspek ${cat}, ananda menunjukkan kekuatan yang sangat baik. `;
            else if (avg >= 3) narrative += `Aspek ${cat} berada pada tahap perkembangan stabil namun perlu pengulangan stimulasi. `;
            else narrative += `Aspek ${cat} memerlukan perhatian lebih khusus dan pendekatan stimulasi intensif. `;
        });
        return narrative;
    };

    if (submitted) {
        const narrative = generateNarrative();
        return (
            <div className="screen-container">
                <h2 className="screen-title">Hasil Evaluasi Naratif</h2>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ color: 'var(--navy-blue)' }}>{childName}</h3>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>Usia: {childAge} Tahun | Pertemuan ke-{sessionCount}</p>
                    <h4 style={{ marginTop: '1rem', color: 'var(--navy-blue)' }}>Ringkasan Perkembangan:</h4>
                    <p style={{ lineHeight: 1.7, color: '#555', fontSize: '0.9rem' }}>{narrative}</p>
                    {['Sensori','Motorik Kasar','Sosial'].map(cat => {
                        const indics = evaluationIndicators.filter(i => i.category === cat);
                        const avg = indics.reduce((acc,curr) => acc + (answers[curr.id]||0), 0) / indics.length;
                        return (<div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid #eee' }}><span>{cat}</span><span style={{ fontWeight:'800', color: avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : '#ef4444' }}>{avg.toFixed(1)}</span></div>);
                    })}
                </div>
                <button onClick={() => { setSubmitted(false); setAnswers({}); setChildName(''); setChildAge(''); }} className="profile-btn primary" style={{ marginTop: '1rem' }}>Buat Evaluasi Baru</button>
            </div>
        );
    }

    return (
        <div className="screen-container">
            <h2 className="screen-title">Evaluasi Segitiga Belajar</h2>
            <div className="card" style={{ padding: '1rem' }}>
                <div className="form-group"><label className="form-label">Nama Ananda</label><input type="text" value={childName} onChange={e => setChildName(e.target.value)} placeholder="Nama lengkap anak..." className="form-input" /></div>
                <div className="form-group"><label className="form-label">Usia (Tahun)</label><input type="number" value={childAge} onChange={e => setChildAge(e.target.value)} placeholder="Contoh: 4" className="form-input" /></div>
                <label className="form-label">Pilih Tahap Pertemuan:</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>{[1,3,7].map(num => (<button key={num} onClick={() => { setSessionCount(num as 1|3|7); setAnswers({}); }} className="profile-btn" style={{ flex:1, background: sessionCount===num?'var(--brand-pink)':'#f0f2f5', color: sessionCount===num?'white':'#666' }}>{num} Kali</button>))}</div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0' }}>Progress: {Object.keys(answers).length}/{evaluationIndicators.length}</p><div style={{background:'#e5e7eb',borderRadius:'10px',height:'8px',marginBottom:'0.5rem'}}><div style={{background:'var(--brand-pink)',borderRadius:'10px',height:'8px',width:`${(Object.keys(answers).length/evaluationIndicators.length)*100}%`,transition:'width 0.3s'}}></div></div><p style={{fontSize:'0.85rem',color:'#666'}}>Skala 1-5 untuk pertemuan ke-{sessionCount}</p>
            {evaluationIndicators.map((q, qIndex) => (
                <div key={q.id} className="card" style={{ padding: '0.8rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--brand-pink)', fontWeight: '700' }}>{q.category}</div>
                    <p style={{ fontSize: '0.85rem', margin: '0.3rem 0 0.5rem', color: '#333' }}>{qIndex + 1}. {q.text}</p>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>{[1,2,3,4,5].map(val => (<button key={val} onClick={() => handleSelect(q.id, val)} style={{ flex:1, padding:'0.5rem 0', borderRadius:'10px', border:'1px solid #eee', background: answers[q.id]===val?'var(--navy-blue)':'white', color: answers[q.id]===val?'white':'#666', fontWeight:'800', fontSize:'0.8rem', cursor:'pointer' }}>{val}</button>))}</div>
                </div>
            ))}
            <button onClick={() => { if (!isComplete) return; fetch(SHEET_API, { method:'POST', body: JSON.stringify({ action:'saveEvaluation', evaluation:{ userId:0, childName, childAge, sessionCount, answers, narrative:'' } }), mode:'no-cors' }).catch(()=>{}); setSubmitted(true); }} className="profile-btn primary" style={{ marginTop:'1rem', opacity: isComplete?1:0.5 }}>Simpan Evaluasi Pertemuan {sessionCount}</button>
            {!isComplete && <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#f59e0b', marginTop:'0.5rem' }}>Mohon lengkapi {evaluationIndicators.length - Object.keys(answers).length} indikator lagi</p>}
        </div>
    );
};

// --- CHAT SCREEN ---
interface Message { id: number; text: string; sender: 'user' | 'teacher'; timestamp: Date; imageUrl?: string; }

const ChatScreen = ({ recipient, onBack }: { recipient: BaseProfile, onBack: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Halo! Saya ${recipient.name}. Ada yang bisa saya bantu?`, sender: 'teacher', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [timeLeft, setTimeLeft] = useState(600);
    const [isExpired, setIsExpired] = useState(false);

    React.useEffect(() => {
        if (timeLeft <= 0) { setIsExpired(true); return; }
        const timer = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}`; };

    const handleSendMessage = (text: string, imageUrl?: string) => {
        if (isExpired || (!text.trim() && !imageUrl)) return;
        const newMessage: Message = { id: Date.now(), text, sender: 'user', timestamp: new Date(), imageUrl };
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Terima kasih pesannya. Senang bisa berdiskusi dengan Anda!', sender: 'teacher', timestamp: new Date() }]);
        }, 1500);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { handleSendMessage('', reader.result as string); }; reader.readAsDataURL(file); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa' }}>
            <div style={{ background: 'var(--navy-blue)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><IconBack /></button>
                <div><h3 style={{ margin: 0, fontSize: '1rem' }}>{recipient.name}</h3><span style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : '#22c55e' }}>{isExpired ? 'Sesi Berakhir' : `Sesi Aktif: ${formatTime(timeLeft)}`}</span></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ maxWidth: '80%', padding: '0.6rem 1rem', borderRadius: '16px', background: msg.sender === 'user' ? 'var(--brand-pink)' : 'white', color: msg.sender === 'user' ? 'white' : '#333', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            {msg.imageUrl && <img src={msg.imageUrl} alt="upload" style={{ width: '100%', borderRadius: '8px', marginBottom: '0.3rem' }} />}
                            {msg.text && <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p>}
                            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}
                {isExpired && <div className="card" style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>Sesi chat 10 menit telah berakhir.</div>}
            </div>
            {!isExpired && (
                <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid #eee', background: 'white' }}>
                    <label style={{ cursor: 'pointer' }}><IconCamera /><input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} /></label>
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage(inputText)} placeholder="Ketik pesan..." style={{ flex: 1, padding: '0.6rem', borderRadius: '20px', border: '1px solid #ddd', fontSize: '0.85rem' }} />
                    <button onClick={() => handleSendMessage(inputText)} style={{ background: 'var(--brand-pink)', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IconSend /></button>
                </div>
            )}
        </div>
    );
};

// --- MEMBERS SCREEN ---
const MembersScreen = ({ onChat }: { onChat: (m: BaseProfile) => void }) => {
    const [friends, setFriends] = useState<number[]>([]);
    const toggleFriend = (id: number) => { setFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]); };
    return (
        <div className="screen-container">
            <h2 className="screen-title">Daftar Member hyplay.id</h2>
            {initialMembers.map(m => (
                <div key={m.id} className="card" style={{ padding: '1rem', marginBottom: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <img src={m.avatar} alt={m.name} style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f0f2f5' }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-blue)' }}>{m.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{m.location}</p><p style={{fontSize:'0.75rem',color:'#888',margin:'0.2rem 0'}}>{m.bio}</p>{m.children && m.children.length > 0 && <p style={{fontSize:'0.7rem',color:'var(--brand-pink)',margin:'0.2rem 0'}}>Anak: {m.children.map(c => `${c.name} (${c.age}th, ${c.specialNeeds})`).join(', ')}</p>}
                    </div>
                    <button onClick={() => toggleFriend(m.id)} className="profile-btn outline" style={{ width: 'auto', padding: '0.4rem 0.8rem', background: friends.includes(m.id) ? 'var(--brand-pink)' : '#f0f2f5', color: friends.includes(m.id) ? 'white' : 'var(--navy-blue)' }}>{friends.includes(m.id) ? 'Friend' : '+ Friend'}</button>
                    <button onClick={() => onChat(m)} className="profile-btn outline" style={{ width: 'auto', padding: '0.4rem 0.8rem' }}>Chat</button>
                </div>
            ))}
        </div>
    );
};

// --- REFERENCE SCREEN ---
const ReferenceScreen = () => {
    const [cityFilter, setCityFilter] = useState('Semua');
    const [onlyPool, setOnlyPool] = useState(false);
    const filteredLocations = useMemo(() => PlayLocationsData.filter(loc => {
        const matchCity = cityFilter === 'Semua' || loc.city === cityFilter;
        const matchPool = !onlyPool || loc.hasPool;
        return matchCity && matchPool;
    }), [cityFilter, onlyPool]);
    return (
        <div className="screen-container">
            <h2 className="screen-title">Referensi Playdate</h2>
            <div className="card" style={{ padding: '0.8rem', marginBottom: '0.8rem' }}>
                <label className="form-label">Filter Kota</label>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="form-input">
                    <option value="Semua">Semua Kota</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={onlyPool} onChange={e => setOnlyPool(e.target.checked)} /> Hanya yang ada Kolam Renang
                </label>
            </div>
            {filteredLocations.map(loc => (
                <div key={loc.id} className="card" style={{ marginBottom: '0.8rem', overflow: 'hidden' }}>
                    <img src={loc.imageUrl} alt={loc.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/f0f2f5/999?text=Playground'; }} />
                    <div style={{ padding: '0.8rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-blue)' }}>{loc.name}</h3>
                        {loc.hasPool && <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600' }}>Ada Kolam</span>}
                        <p style={{ margin: '0.3rem 0', fontSize: '0.8rem', color: '#888' }}>{loc.city} - {loc.address}</p>
                        <a href={loc.mapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-pink)', fontSize: '0.8rem', fontWeight: '600' }}>Buka Google Maps</a>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- PROFILE SCREEN (FIX 3: + Logout) ---
const ProfileScreen = ({ userProfile, onMessage, onLogout }: { userProfile: UserProfile, onMessage: (p: UserProfile) => void, onLogout: () => void }) => (
    <div className="screen-container">
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <img src={userProfile.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto', background: '#f0f2f5' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1rem 0' }}>
                <div><strong>{userProfile.posts.length}</strong><br /><span style={{ fontSize: '0.75rem', color: '#888' }}>Posts</span></div>
                <div><strong>{userProfile.followers}</strong><br /><span style={{ fontSize: '0.75rem', color: '#888' }}>Followers</span></div>
                <div><strong>{userProfile.following}</strong><br /><span style={{ fontSize: '0.75rem', color: '#888' }}>Following</span></div>
            </div>
            <h3 style={{ margin: '0.5rem 0 0', color: 'var(--navy-blue)' }}>{userProfile.name}</h3>
            <p style={{ color: 'var(--brand-pink)', fontSize: '0.8rem', margin: '0.2rem 0' }}>{userProfile.role === 'teacher' ? 'Official Teacher' : 'Parent Account'}</p>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>{userProfile.bio}</p>
            <p style={{ color: '#888', fontSize: '0.8rem' }}>{userProfile.location} | {userProfile.age} Thn</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="profile-btn outline" style={{ flex: 1 }}>Edit Profile</button>
                <button onClick={() => onMessage(userProfile)} className="profile-btn outline" style={{ flex: 1 }}>Message</button>
            </div>
            <button onClick={onLogout} style={{ marginTop: '1rem', width: '100%', padding: '0.7rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><IconLogout /> Keluar / Logout</button>
        </div>
        {userProfile.posts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '1rem' }}>
                {userProfile.posts.map(post => <img key={post.id} src={post.imageUrl} alt="post" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />)}
            </div>
        ) : <div className="card" style={{ textAlign: 'center', padding: '2rem', marginTop: '1rem', color: '#888' }}>Belum ada postingan</div>}
    </div>
);

// --- SCHEDULE SCREEN (FIX 5) ---
const ScheduleScreen = () => {
    const typeColor = { playdate: '#22c55e', konsultasi: 'var(--brand-pink)', evaluasi: '#f59e0b' };
    const typeLabel = { playdate: 'Playdate', konsultasi: 'Konsultasi', evaluasi: 'Evaluasi' };
    return (
        <div className="screen-container">
            <h2 className="screen-title">Jadwal Kegiatan</h2>
            {mockSchedule.map(item => (
                <div key={item.id} className="card" style={{ padding: '1rem', marginBottom: '0.8rem', borderLeft: `4px solid ${typeColor[item.type]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-blue)' }}>{item.title}</h3>
                        <span style={{ background: typeColor[item.type], color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{typeLabel[item.type]}</span>
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#888' }}>{formatTanggalID(item.date)} | {item.time} WIB</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#666' }}>{item.location}</p>
                </div>
            ))}
            <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '2px dashed #ddd', background: 'transparent' }}>
                <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>+ Tambah Jadwal Baru</p>
            </div>
        </div>
    );
};

// --- IDEAS SCREEN (FIX 7: AI Generator) ---
const IdeasScreen = () => {
    const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiIdea, setAiIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filteredIdeas = useMemo(() => {
        if (categoryFilter === 'Semua') return PlayIdeasData;
        return PlayIdeasData.filter(i => i.category === categoryFilter);
    }, [categoryFilter]);

    const generateAiIdea = async () => {
        if (!aiPrompt.trim()) return;
        setIsLoading(true);
        setAiIdea('');
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Berikan 1 ide bermain kreatif untuk anak berkebutuhan khusus berdasarkan: "${aiPrompt}". Format: Judul, Bahan yang dibutuhkan, Langkah singkat (3-4 langkah), Manfaat. Gunakan bahasa Indonesia yang ramah orang tua.`
            });
            setAiIdea(response.text || 'Tidak ada respons dari AI.');
        } catch (error) {
            setAiIdea('Maaf, tidak dapat menghubungi AI saat ini. Coba lagi nanti.');
        }
        setIsLoading(false);
    };

    return (
        <div className="screen-container">
            <h2 className="screen-title">Ide Bermain</h2>
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--navy-blue), #2563eb)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><IconSparkle /><span style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>Generate Ide dengan AI Gemini</span></div>
                <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && generateAiIdea()} placeholder="Contoh: anak autis usia 4 tahun suka air..." style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: 'none', fontSize: '0.85rem', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                <button onClick={generateAiIdea} disabled={isLoading} style={{ background: 'var(--brand-pink)', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>{isLoading ? 'Generating...' : 'Generate Ide'}</button>
                {aiIdea && (<div style={{ marginTop: '0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.8rem' }}><p style={{ color: 'white', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{aiIdea}</p></div>)}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                {['Semua', ...categories].map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: 'none', background: categoryFilter === cat ? 'var(--brand-pink)' : '#f0f2f5', color: categoryFilter === cat ? 'white' : '#666', fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat}</button>
                ))}
            </div>
            {filteredIdeas.map(idea => (
                <div key={idea.id} className="card" style={{ padding: '1rem', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <span style={{ fontSize: '2rem' }}>{idea.emoji}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--brand-pink)', fontWeight: '700', marginBottom: '0.2rem' }}>{idea.category}</div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-blue)' }}>{idea.title}</h3>
                            <p style={{ margin: '0.3rem 0', fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>{idea.description}</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a href={idea.youtubeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', padding: '4px 8px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}><IconYoutube /> YouTube</a>
                                <a href={idea.pinterestUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fce7f3', padding: '4px 8px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.75rem', color: '#E60023', fontWeight: '600' }}><IconPinterest /> Pinterest</a>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- APP COMPONENT ---
const App = () => {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeChat, setActiveChat] = useState<BaseProfile | null>(null);
    const [teachers, setTeachers] = useState(initialTeachers);
    const [isPlayingSound, setIsPlayingSound] = useState(false);

    const playWelcomeSound = async () => {
        if (isPlayingSound) return;
        setIsPlayingSound(true);
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: 'Hai Ayah Bunda! Selamat datang di hyplay.id, rumah bagi keceriaan dan petualangan playdate yang inklusif untuk setiap anak!' }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
                audio.onended = () => setIsPlayingSound(false);
                await audio.play();
            } else { setIsPlayingSound(false); }
        } catch { setIsPlayingSound(false); }
    };

    const handleRegister = (user: UserProfile) => {
        setUserProfile(user);
        if (user.role === 'teacher') { setTeachers(prev => [user as TeacherProfileData, ...prev]); }
    };

    // FIX 3: Logout
    const handleLogout = () => {
        if (confirm('Yakin ingin keluar?')) {
            setUserProfile(null);
            setActiveTab('home');
            setActiveChat(null);
        }
    };

    if (!userProfile) { return <RegistrationScreen onRegister={handleRegister} />; }

    const renderTab = () => {
        if (activeChat) return <ChatScreen recipient={activeChat} onBack={() => setActiveChat(null)} />;
        switch (activeTab) {
            case 'home': return (
                <div className="screen-container">
                    <div style={{ background: 'linear-gradient(135deg, var(--navy-blue), #1e3a5f)', borderRadius: '16px', padding: '1.5rem', color: 'white', marginBottom: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Selamat datang kembali,</p>
                        <h2 style={{ margin: '0.2rem 0 0.8rem', fontSize: '1.2rem' }}>{userProfile.name}</h2>
                        <button onClick={playWelcomeSound} disabled={isPlayingSound} style={{ background: isPlayingSound ? 'rgba(255,255,255,0.2)' : 'var(--brand-pink)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <IconSound /> {isPlayingSound ? 'Memutar...' : 'Dengarkan Sambutan'}
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Ide Bermain', value: `${PlayIdeasData.length}+`, color: '#dbeafe', textColor: '#2563eb', tab: 'ideas' as Tab },
                            { label: 'Lokasi Playdate', value: `${PlayLocationsData.length}+`, color: '#dcfce7', textColor: '#16a34a', tab: 'referensi' as Tab },
                            { label: 'Konsultan', value: `${teachers.length}`, color: '#fce7f3', textColor: '#db2777', tab: 'konsultasi' as Tab },
                            { label: 'Member', value: `${initialMembers.length}+`, color: '#fef3c7', textColor: '#d97706', tab: 'members' as Tab },
                        ].map(stat => (
                            <button key={stat.tab} onClick={() => setActiveTab(stat.tab)} style={{ background: stat.color, border: 'none', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: stat.textColor }}>{stat.value}</div>
                                <div style={{ fontSize: '0.75rem', color: stat.textColor, fontWeight: '600' }}>{stat.label}</div>
                            </button>
                        ))}
                    </div>
                    <h3 style={{ color: 'var(--navy-blue)', marginBottom: '0.5rem' }}>Jadwal Terdekat</h3>
                    {mockSchedule.slice(0, 2).map(item => (
                        <div key={item.id} className="card" style={{ padding: '0.8rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--navy-blue)' }}>{item.title}</p><p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{formatTanggalID(item.date)} | {item.time}</p></div>
                            <span style={{ background: 'var(--brand-pink)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>{item.type}</span>
                        </div>
                    ))}
                </div>
            );
            case 'schedule': return <ScheduleScreen />;
            case 'ideas': return <IdeasScreen />;
            case 'evaluation': return <EvaluationScreen />;
            case 'referensi': return <ReferenceScreen />;
            case 'members': return <MembersScreen onChat={setActiveChat} />;
            case 'konsultasi': return (
                <div className="screen-container">
                    <h2 className="screen-title">Pusat Konsultasi Guru</h2>
                    {teachers.map(t => (
                        <div key={t.id} className="card" style={{ padding: '1rem', marginBottom: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <img src={t.avatar} alt={t.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-blue)' }}>{t.name}</h3>
                                <span style={{ fontSize: '0.75rem', color: t.id > 200 ? 'var(--brand-pink)' : '#666' }}>{t.id > 200 ? 'Expert' : 'Registered Guru'}</span>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#888' }}>{t.specialization} | {t.experience} {t.isOnline && <span style={{color:'#22c55e',fontSize:'0.7rem'}}> Online</span>}</p>
                            </div>
                            <button onClick={() => setActiveChat(t)} className="profile-btn outline" style={{ width: 'auto', padding: '0.4rem 0.8rem' }}>Chat</button>
                        </div>
                    ))}
                </div>
            );
            case 'profile': return <ProfileScreen userProfile={userProfile} onMessage={(p) => setActiveChat(p)} onLogout={handleLogout} />;
        }
    };

    const navItems: { tab: Tab; label: string; icon: JSX.Element }[] = [
        { tab: 'home', label: 'Home', icon: <IconHome /> },
        { tab: 'schedule', label: 'Jadwal', icon: <IconCalendar /> },
        { tab: 'ideas', label: 'Ide', icon: <IconBulb /> },
        { tab: 'referensi', label: 'Playdate', icon: <IconMap /> },
        { tab: 'members', label: 'Member', icon: <IconUsers /> },
        { tab: 'evaluation', label: 'Evaluasi', icon: <IconClipboard /> },
        { tab: 'konsultasi', label: 'Konsul', icon: <IconKonsultasi /> },
        { tab: 'profile', label: 'Profil', icon: <IconUser /> },
    ];

    return (
        <div className="app-container">
            <header className="app-header">
                <HyplayLogo />
            </header>
            <main className="app-main">{renderTab()}</main>
            <nav className="app-nav">
                {navItems.map(item => (
                    <button key={item.tab} onClick={() => { setActiveTab(item.tab); setActiveChat(null); }} className={`nav-item ${activeTab === item.tab && !activeChat ? 'active' : ''}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
