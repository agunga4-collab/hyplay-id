
import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

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
}

interface TeacherProfileData extends BaseProfile {
    role: 'teacher';
    background: string;
    experience: string;
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
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea24ec83abc?w=400&h=400&fit=crop', likes: 24, caption: 'Bermain pasir hari ini!' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=400&fit=crop', likes: 12, caption: 'Melukis dengan jari seru sekali.' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=400&fit=crop', likes: 56, caption: 'Kegiatan sensory di taman.' },
];

const categories = ['Sensori', 'Tradisional', 'Sains', 'Keluarga', 'Seni', 'Fisik'] as const;

// Ekspansi 120 Ide Bermain
const rawIdeas: PlayIdea[] = [];
for (let i = 1; i <= 120; i++) {
    const cat = categories[i % categories.length];
    const emojis = ['🧩', '🎾', '🎻', '🪁', '🔦', '🎈', '🍪', '🧱', '🧹', '🛁', '🎨', '🏃'];
    rawIdeas.push({
        id: i,
        category: cat,
        emoji: emojis[i % emojis.length],
        title: `${cat} Fun Activity #${i}`,
        description: `Metode bermain ${cat} yang dirancang khusus untuk meningkatkan stimulasi ananda melalui pendekatan inklusif di rumah.`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${cat}+play+activities+kids`,
        pinterestUrl: `https://id.pinterest.com/search/pins/?q=${cat}%20activity%20kids`
    });
}
const PlayIdeasData = rawIdeas;

// Ekspansi 105 Referensi Playdate Lengkap dengan Google Maps
const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Bekasi', 'Tangerang', 'Depok', 'Bali', 'Medan'];
const rawLocations: PlayLocation[] = [];
for (let i = 1; i <= 105; i++) {
    const city = cities[i % cities.length];
    const isPool = i % 4 === 0;
    rawLocations.push({
        id: i,
        name: `Destinasi Playdate ${i}`,
        city: city,
        address: `Jl. Inklusi No. ${i}, ${city}`,
        facilities: isPool ? ['Kolam Renang', 'Parkir', 'Kafe'] : ['Playground', 'Edukasi', 'AC'],
        hasPool: isPool,
        imageUrl: `https://images.unsplash.com/photo-${1540000000000 + i}?w=400&h=300&fit=crop`,
        mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`Playground and Playdate in ${city} ${i}`)}`
    });
}
const PlayLocationsData = rawLocations;

const initialTeachers: TeacherProfileData[] = [
    {
        id: 101,
        role: 'teacher',
        name: 'Ibu Sarah, S.Pd',
        age: 32,
        avatar: avatars[0],
        bio: 'Ahli intervensi dini dan stimulasi sensori.',
        location: 'Jakarta',
        followers: 120,
        following: 80,
        posts: [],
        background: 'S1 Pendidikan Luar Biasa',
        experience: '8 Tahun'
    },
    {
        id: 102,
        role: 'teacher',
        name: 'Bapak Ahmad, M.Psi',
        age: 35,
        avatar: avatars[1],
        bio: 'Psikolog perkembangan anak khusus inklusi.',
        location: 'Bandung',
        followers: 250,
        following: 150,
        posts: [],
        background: 'S2 Psikologi Anak',
        experience: '10 Tahun'
    }
];

const initialMembers: ParentProfileData[] = [
    {
        id: 201,
        role: 'parent',
        name: 'Mama Arka',
        age: 28,
        avatar: avatars[2],
        bio: 'Suka berbagi ide bermain sensori di rumah.',
        location: 'Jakarta Selatan',
        followers: 45,
        following: 30,
        posts: []
    },
    {
        id: 202,
        role: 'parent',
        name: 'Papa Kenzie',
        age: 34,
        avatar: avatars[3],
        bio: 'Ayah yang aktif mendampingi ananda bermain.',
        location: 'Bekasi',
        followers: 20,
        following: 15,
        posts: []
    },
    {
        id: 203,
        role: 'parent',
        name: 'Bunda Naura',
        age: 30,
        avatar: avatars[4],
        bio: 'Mari berteman dan berbagi pengalaman inklusi.',
        location: 'Tangerang',
        followers: 88,
        following: 120,
        posts: []
    }
];

// --- ICONS ---
const IconHome = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const IconSound = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>);
const IconUser = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconBulb = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.674M12 3v1m8 8h-1M4 12H3m15.357-5.657l-.707.707M6.35 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>);
const IconClipboard = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>);
const IconCalendar = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const IconKonsultasi = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>);
const IconBack = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>);
const IconGrid = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const IconCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconMap = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>);
const IconUsers = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const IconCamera = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const IconSend = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const IconYoutube = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505a3.017 3.017 0 0 0-2.122 2.136C0 8.055 0 12 0 12s0 3.945.501 5.814a3.017 3.017 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.945 24 12 24 12s0-3.945-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);
const IconPinterest = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.259 7.929-7.259 4.164 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.12 1.063.328 2.195.507 3.367.507 6.621 0 11.988-5.367 11.988-11.987C23.987 5.367 18.638 0 12.017 0z"/></svg>);

// --- LOGO ---
// Fix: Added missing HyplayLogo component used in Registration and Home screens to fix "Cannot find name 'HyplayLogo'" errors.
const HyplayLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '24px' }}>
        <div style={{ background: '#0d2c54', color: 'white', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>H</div>
        <span style={{ color: '#0d2c54' }}>hyplay<span style={{ color: '#f43f5e' }}>.id</span></span>
    </div>
);

// --- REGISTRATION SCREEN ---

const RegistrationScreen = ({ onRegister }: { onRegister: (user: UserProfile) => void }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [role, setRole] = useState<'parent' | 'teacher'>('parent');
    const [location, setLocation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !age || !location) {
            alert('Harap lengkapi semua data!');
            return;
        }

        let newUser: UserProfile;
        if (role === 'parent') {
            newUser = { id: Date.now(), role: 'parent', name, age: parseInt(age), location, avatar: avatars[Math.floor(Math.random() * avatars.length)], bio: 'Orang tua yang aktif mendampingi ananda ✨', followers: 0, following: 0, posts: [] };
        } else {
            newUser = { id: Date.now(), role: 'teacher', name, age: parseInt(age), location, avatar: avatars[Math.floor(Math.random() * avatars.length)], bio: 'Guru berdedikasi untuk pendidikan inklusif 🏫', followers: 0, following: 0, posts: [], background: 'Pendidikan Inklusi', experience: 'Baru Bergabung' };
        }
        onRegister(newUser);
    };

    return (
        <div className="screen sign-in-screen">
            <div className="welcome-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="brand-logo-container"><HyplayLogo /></div>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--navy-blue)' }}>Daftar hyplay.id</h2>
                <form onSubmit={handleSubmit} className="card" style={{ textAlign: 'left' }}>
                    <div className="form-group"><label>Nama Lengkap</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda..." /></div>
                    <div className="form-group"><label>Umur</label><input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Umur Anda..." /></div>
                    <div className="form-group"><label>Peran</label><div className="session-tabs"><button type="button" className={role === 'parent' ? 'active' : ''} onClick={() => setRole('parent')}>Orang Tua</button><button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}>Guru</button></div></div>
                    <div className="form-group"><label>Lokasi</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Contoh: Jakarta Selatan" /></div>
                    <button type="submit" className="cta-button-large" style={{ marginTop: '1rem' }}>Daftar & Masuk</button>
                </form>
            </div>
        </div>
    );
};

// --- EVALUATION SCREEN ---

const evaluationIndicators = [
    // SENSORI (15)
    { id: 1, text: "Respons terhadap sentuhan atau berbagai tekstur alat main.", category: "Sensori" },
    { id: 2, text: "Fokus visual pada objek atau kegiatan yang sedang berlangsung.", category: "Sensori" },
    { id: 3, text: "Kemampuan membedakan suara instruksi di lingkungan bermain.", category: "Sensori" },
    { id: 4, text: "Keseimbangan tubuh saat bergerak atau berpindah tempat (Vestibular).", category: "Sensori" },
    { id: 5, text: "Kesadaran posisi tubuh saat duduk atau berdiri (Proprioceptive).", category: "Sensori" },
    { id: 6, text: "Toleransi terhadap aroma atau rasa di lingkungan sekitar.", category: "Sensori" },
    { id: 7, text: "Koordinasi mata dan tangan dalam menyelesaikan tugas bermain.", category: "Sensori" },
    { id: 8, text: "Kemampuan meniru gerakan motorik sederhana (Motor Planning).", category: "Sensori" },
    { id: 9, text: "Respons terhadap perubahan cahaya atau kontras warna di area bermain.", category: "Sensori" },
    { id: 10, text: "Kemampuan membedakan berat atau ringan objek saat dipegang.", category: "Sensori" },
    { id: 11, text: "Adaptasi suhu air saat masuk ke kolam (Hydro-Sensory).", category: "Sensori" },
    { id: 12, text: "Toleransi terhadap percikan air pada wajah atau tubuh.", category: "Sensori" },
    { id: 13, text: "Kesadaran taktil terhadap tekanan air/hidrostatik.", category: "Sensori" },
    { id: 14, text: "Fokus visual pada objek di bawah permukaan air.", category: "Sensori" },
    { id: 15, text: "Respons terhadap suara gema atau riak air di kolam.", category: "Sensori" },
    // MOTORIK KASAR (15)
    { id: 16, text: "Keseimbangan saat posisi diam (duduk atau berdiri statis).", category: "Motorik Kasar" },
    { id: 17, text: "Stabilitas dan kelenturan saat berjalan atau berlari.", category: "Motorik Kasar" },
    { id: 18, text: "Kemampuan melompat atau berjingkat dengan koordinasi baik.", category: "Motorik Kasar" },
    { id: 19, text: "Kekuatan otot lengan saat melempar atau menangkap objek.", category: "Motorik Kasar" },
    { id: 20, text: "Koordinasi gerak antara tubuh bagian atas dan bawah.", category: "Motorik Kasar" },
    { id: 21, text: "Daya tahan fisik (stamina) selama durasi sesi bermain.", category: "Motorik Kasar" },
    { id: 22, text: "Postur tubuh yang tegak dan terjaga selama beraktivitas.", category: "Motorik Kasar" },
    { id: 23, text: "Kemampuan memanjat atau melewati rintangan rendah secara mandiri.", category: "Motorik Kasar" },
    { id: 24, text: "Koordinasi saat menendang bola atau merespons objek bergerak.", category: "Motorik Kasar" },
    { id: 25, text: "Keluwesan dalam mengubah arah gerakan secara mendadak.", category: "Motorik Kasar" },
    { id: 26, text: "Keseimbangan tubuh saat berjalan di dalam air (Hydro-Motor).", category: "Motorik Kasar" },
    { id: 27, text: "Stabilitas postur saat terapung dengan bantuan (Buoyancy).", category: "Motorik Kasar" },
    { id: 28, text: "Kekuatan tungkai saat melakukan gerakan menendang di air.", category: "Motorik Kasar" },
    { id: 29, text: "Koordinasi tangan dan kaki saat gerakan mendayung di air.", category: "Motorik Kasar" },
    { id: 30, text: "Kemampuan mengontrol pernapasan saat beraktivitas di air.", category: "Motorik Kasar" },
    // SOSIAL (10)
    { id: 31, text: "Mempertahankan kontak mata saat berinteraksi dengan orang lain.", category: "Sosial" },
    { id: 32, text: "Kemampuan mengikuti instruksi sederhana dari guru atau orang tua.", category: "Sosial" },
    { id: 33, text: "Kesabaran dalam menunggu giliran bermain (turn-taking).", category: "Sosial" },
    { id: 34, text: "Kemauan berbagi alat main atau bekerja sama dengan teman.", category: "Sosial" },
    { id: 35, text: "Mengekspresikan emosi (senang/sedih) secara wajar dan terkendali.", category: "Sosial" },
    { id: 36, text: "Merespons sapaan atau inisiasi sosial dari teman sebaya.", category: "Sosial" },
    { id: 37, text: "Kemampuan memulai percakapan atau interaksi sederhana secara spontan.", category: "Sosial" },
    { id: 38, text: "Memahami batasan ruang pribadi saat bermain dengan teman.", category: "Sosial" },
    { id: 39, text: "Menunjukkan empati saat teman merasa sedih atau mengalami kesulitan.", category: "Sosial" },
    { id: 40, text: "Kemampuan menyelesaikan konflik kecil secara mandiri atau bantuan minimal.", category: "Sosial" }
];

const EvaluationScreen = () => {
    const [sessionCount, setSessionCount] = useState<1 | 3 | 7>(1);
    const [childName, setChildName] = useState('');
    const [childAge, setChildAge] = useState('');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (indicatorId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [indicatorId]: value }));
    };

    const isComplete = Object.keys(answers).length === evaluationIndicators.length && childName && childAge;

    const generateNarrative = () => {
        const categories = ["Sensori", "Motorik Kasar", "Sosial"];
        const summary: Record<string, { total: number, count: number }> = {};
        
        categories.forEach(cat => summary[cat] = { total: 0, count: 0 });
        
        evaluationIndicators.forEach(ind => {
            const score = answers[ind.id] || 0;
            summary[ind.category].total += score;
            summary[ind.category].count += 1;
        });

        let narrative = `Berdasarkan hasil evaluasi pertemuan ke-${sessionCount}, ananda ${childName} (${childAge} tahun) menunjukkan perkembangan yang bervariasi. `;

        categories.forEach(cat => {
            const avg = summary[cat].total / summary[cat].count;
            if (avg >= 4) {
                narrative += `Di aspek ${cat}, ananda menunjukkan kekuatan yang sangat baik, di mana stimulasi yang diberikan telah merespons kebutuhan ananda secara optimal. `;
            } else if (avg >= 3) {
                narrative += `Aspek ${cat} ananda berada pada tahap perkembangan yang stabil namun tetap memerlukan pengulangan stimulasi yang konsisten. `;
            } else {
                narrative += `Aspek ${cat} merupakan area yang memerlukan perhatian lebih khusus dan pendekatan stimulasi yang lebih intensif di rumah maupun di sesi berikutnya. `;
            }
        });

        return narrative;
    };

    if (submitted) {
        const narrative = generateNarrative();
        return (
            <div className="screen">
                <h2>Hasil Evaluasi Naratif</h2>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ borderBottom: '2px solid var(--brand-pink)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.1rem' }}>{childName}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Usia: {childAge} Tahun | Pertemuan ke-{sessionCount}</p>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--brand-pink)', marginBottom: '0.5rem' }}>Ringkasan Perkembangan:</h4>
                        <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#444', fontStyle: 'italic' }}>"{narrative}"</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {["Sensori", "Motorik Kasar", "Sosial"].map(cat => {
                            const indics = evaluationIndicators.filter(i => i.category === cat);
                            const avg = indics.reduce((acc, curr) => acc + (answers[curr.id] || 0), 0) / indics.length;
                            return (
                                <div key={cat} style={{ textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>{cat}</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--navy-blue)' }}>{avg.toFixed(1)}</p>
                                </div>
                            );
                        })}
                    </div>

                    <button className="cta-button-large" onClick={() => { setSubmitted(false); setAnswers({}); setChildName(''); setChildAge(''); }}>
                        Buat Evaluasi Baru
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="screen">
            <h2>Evaluasi Segitiga Belajar</h2>
            
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                    <label>Nama Ananda</label>
                    <input type="text" value={childName} onChange={e => setChildName(e.target.value)} placeholder="Nama lengkap anak..." />
                </div>
                <div className="form-group">
                    <label>Usia (Tahun)</label>
                    <input type="number" value={childAge} onChange={e => setChildAge(e.target.value)} placeholder="Contoh: 4" />
                </div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Pilih Tahap Pertemuan:</label>
                <div className="session-tabs">
                    {[1, 3, 7].map(num => (
                        <button 
                            key={num} 
                            className={sessionCount === num ? 'active' : ''} 
                            onClick={() => { setSessionCount(num as 1|3|7); setAnswers({}); }}
                        >
                            {num} Kali
                        </button>
                    ))}
                </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem', textAlign: 'center', padding: '0 1rem' }}>
                Berikan penilaian perkembangan ananda pada pertemuan ke-{sessionCount} (Skala 1-5)
            </p>

            <div className="list">
                {evaluationIndicators.map(q => (
                    <div key={q.id} className="card" style={{ marginBottom: '0.8rem', borderLeft: `4px solid ${q.category === 'Sensori' ? '#66d3fa' : q.category === 'Motorik Kasar' ? '#ffd60a' : '#f03a8d'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span className="category-tag" style={{ background: '#f0f2f5' }}>{q.category}</span>
                            <span style={{ fontSize: '0.65rem', color: '#999' }}>Indikator #{q.id}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy-blue)', lineHeight: '1.4' }}>{q.text}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.3rem', marginTop: '0.8rem' }}>
                            {[1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleSelect(q.id, val)}
                                    style={{
                                        flex: 1,
                                        padding: '0.6rem 0',
                                        borderRadius: '10px',
                                        border: '1px solid #eee',
                                        background: answers[q.id] === val ? 'var(--navy-blue)' : 'white',
                                        color: answers[q.id] === val ? 'white' : '#666',
                                        fontWeight: '800',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '1rem 0' }}>
                <button 
                    className="cta-button-large" 
                    style={{ 
                        opacity: isComplete ? 1 : 0.5,
                        boxShadow: isComplete ? '0 4px 15px rgba(240, 58, 141, 0.3)' : 'none'
                    }} 
                    disabled={!isComplete}
                    onClick={() => setSubmitted(true)}
                >
                    Simpan Evaluasi Pertemuan {sessionCount}
                </button>
                {!isComplete && (
                    <p style={{ fontSize: '0.65rem', color: '#f03a8d', textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        Mohon lengkapi {evaluationIndicators.length - Object.keys(answers).length} indikator lagi
                    </p>
                )}
            </div>
        </div>
    );
};

// --- CHAT SCREEN ---

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'teacher';
    timestamp: Date;
    imageUrl?: string;
}

const ChatScreen = ({ recipient, onBack }: { recipient: BaseProfile, onBack: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Halo! Saya ${recipient.name}. Ada yang bisa saya bantu?`, sender: 'teacher', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [isExpired, setIsExpired] = useState(false);

    React.useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = (text: string, imageUrl?: string) => {
        if (isExpired) return;
        if (!text.trim() && !imageUrl) return;

        const newMessage: Message = {
            id: Date.now(),
            text,
            sender: 'user',
            timestamp: new Date(),
            imageUrl
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Mock response
        setTimeout(() => {
            const response: Message = {
                id: Date.now() + 1,
                text: "Terima kasih pesannya. Senang bisa berdiskusi dengan Anda!",
                sender: 'teacher',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, response]);
        }, 1500);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleSendMessage('', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="screen chat-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IconBack /></button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem' }}>{recipient.name}</h3>
                    <p style={{ fontSize: '0.7rem', color: isExpired ? '#f43f5e' : '#10b981', fontWeight: 'bold' }}>
                        {isExpired ? 'Sesi Berakhir' : `Sesi Aktif: ${formatTime(timeLeft)}`}
                    </p>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '1rem' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: msg.sender === 'user' ? 'var(--brand-pink)' : '#f0f2f5',
                        color: msg.sender === 'user' ? 'white' : 'var(--navy-blue)',
                        padding: '0.8rem',
                        borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="upload" style={{ width: '100%', borderRadius: '10px', marginBottom: '0.5rem' }} />}
                        {msg.text && <p>{msg.text}</p>}
                        <span style={{ fontSize: '0.6rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                {isExpired && (
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#fff1f2', borderRadius: '10px', color: '#be123c', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Sesi chat 10 menit telah berakhir. Silakan mulai sesi baru jika diperlukan.
                    </div>
                )}
            </div>

            {!isExpired && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0' }}>
                    <label style={{ cursor: 'pointer', padding: '0.5rem', color: '#666' }}>
                        <IconCamera />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </label>
                    <input 
                        type="text" 
                        value={inputText} 
                        onChange={e => setInputText(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage(inputText)}
                        placeholder="Ketik pesan..." 
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '20px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                    />
                    <button 
                        onClick={() => handleSendMessage(inputText)}
                        style={{ background: 'var(--brand-pink)', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        <IconSend />
                    </button>
                </div>
            )}
        </div>
    );
};

// --- MEMBERS SCREEN ---

const MembersScreen = ({ onChat }: { onChat: (m: BaseProfile) => void }) => {
    const [friends, setFriends] = useState<number[]>([]);

    const toggleFriend = (id: number) => {
        setFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    return (
        <div className="screen">
            <h2>Daftar Member hyplay.id</h2>
            <div className="list">
                {initialMembers.map(m => (
                    <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={m.avatar} alt={m.name} style={{ width: '50px', height: '50px', borderRadius: '25px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '0.95rem' }}>{m.name}</h3>
                            <p style={{ fontSize: '0.7rem', color: '#666' }}>{m.location}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                                onClick={() => toggleFriend(m.id)} 
                                className="profile-btn outline" 
                                style={{ 
                                    width: 'auto', 
                                    padding: '0.4rem 0.8rem',
                                    background: friends.includes(m.id) ? 'var(--brand-pink)' : '#f0f2f5',
                                    color: friends.includes(m.id) ? 'white' : 'var(--navy-blue)'
                                }}
                            >
                                {friends.includes(m.id) ? 'Friend' : '+ Friend'}
                            </button>
                            <button onClick={() => onChat(m)} className="profile-btn outline" style={{ width: 'auto', padding: '0.4rem 0.8rem' }}>Chat</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- APP SCREENS ---

const ReferenceScreen = () => {
    const [cityFilter, setCityFilter] = useState('Semua');
    const [onlyPool, setOnlyPool] = useState(false);

    const filteredLocations = useMemo(() => {
        return PlayLocationsData.filter(loc => {
            const matchCity = cityFilter === 'Semua' || loc.city === cityFilter;
            const matchPool = !onlyPool || loc.hasPool;
            return matchCity && matchPool;
        });
    }, [cityFilter, onlyPool]);

    return (
        <div className="screen">
            <h2>Referensi Playdate (105+)</h2>
            <div className="filters card" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                    <label>Filter Kota</label>
                    <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                        <option value="Semua">Semua Kota</option>
                        {['Jakarta', 'Bandung', 'Surabaya', 'Bekasi', 'Tangerang', 'Depok', 'Bali', 'Medan'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={onlyPool} onChange={e => setOnlyPool(e.target.checked)} id="poolCheck" />
                    <label htmlFor="poolCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Hanya yang ada Kolam Renang</label>
                </div>
            </div>
            <div className="list">
                {filteredLocations.map(loc => (
                    <div key={loc.id} className="card location-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <img src={loc.imageUrl} alt={loc.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1rem' }}>{loc.name}</h3>
                                {loc.hasPool && <span className="category-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>Ada Kolam</span>}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#666' }}>📍 {loc.city} - {loc.address}</p>
                            <div style={{ marginTop: '0.8rem' }}>
                                <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className="cta-button-small" style={{ display: 'inline-block', background: '#0d2c54', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 800 }}>Buka Google Maps</a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileScreen = ({ userProfile, onMessage }: { userProfile: UserProfile, onMessage: (p: UserProfile) => void }) => (
    <div className="screen social-profile">
        <div className="profile-header">
            <div className="profile-top-row">
                <img src={userProfile.avatar} className="social-avatar" alt="Avatar" />
                <div className="profile-stats">
                    <div className="stat-item"><strong>{userProfile.posts.length}</strong><span>Posts</span></div>
                    <div className="stat-item"><strong>{userProfile.followers}</strong><span>Followers</span></div>
                    <div className="stat-item"><strong>{userProfile.following}</strong><span>Following</span></div>
                </div>
            </div>
            <div className="profile-bio">
                <h3 className="profile-name">{userProfile.name}</h3>
                <p className="profile-role-tag">{userProfile.role === 'teacher' ? 'Official Teacher' : 'Parent Account'}</p>
                <p className="bio-text">{userProfile.bio}</p>
                <p className="location-text">📍 {userProfile.location} • {userProfile.age} Thn</p>
            </div>
            <div className="profile-actions">
                <button className="profile-btn outline">Edit Profile</button>
                <button className="profile-btn outline" onClick={() => onMessage(userProfile)}>Message</button>
            </div>
        </div>
        <div className="profile-tabs-nav">
            <button className="active"><IconGrid /></button>
            <button><IconBulb /></button>
            <button><IconUser /></button>
        </div>
        <div className="post-grid">
            {userProfile.posts.length > 0 ? userProfile.posts.map(post => (
                <div key={post.id} className="grid-item"><img src={post.imageUrl} alt="post" /></div>
            )) : (
                <div className="empty-grid" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center', color: '#bbb' }}>
                    <p>Belum ada postingan</p>
                </div>
            )}
        </div>
    </div>
);

const App = () => {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [teachers, setTeachers] = useState<TeacherProfileData[]>(initialTeachers);
    const [isPlayingSound, setIsPlayingSound] = useState(false);

    const playWelcomeSound = async () => {
        if (isPlayingSound) return;
        setIsPlayingSound(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: 'Hai Ayah Bunda! Selamat datang di hyplay.id, rumah bagi keceriaan dan petualangan playdate yang inklusif untuk setiap anak. Mari kita ciptakan momen bermain yang tak terlupakan bersama-sama!' }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
                audio.onended = () => setIsPlayingSound(false);
                await audio.play();
            } else {
                setIsPlayingSound(false);
            }
        } catch (error) {
            console.error("Error playing sound:", error);
            setIsPlayingSound(false);
        }
    };

    const handleRegister = (user: UserProfile) => {
        setUserProfile(user);
        if (user.role === 'teacher') {
            setTeachers(prev => [user as TeacherProfileData, ...prev]);
        }
    };

    if (!userProfile) {
        return <RegistrationScreen onRegister={handleRegister} />;
    }

    const renderTab = () => {
        if (activeChat) return <ChatScreen recipient={activeChat} onBack={() => setActiveChat(null)} />;
        switch (activeTab) {
            case 'home': return (
                <div className="screen home-screen">
                    <div className="welcome-card">
                        <div className="brand-logo-container"><HyplayLogo /></div>
                        <div className="welcome-text-container">
                            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--navy-blue)', marginBottom: '0.5rem' }}>Hai Ayah Bunda!</p>
                            <p>Selamat datang di <strong>hyplay.id</strong>, rumah bagi keceriaan dan petualangan playdate yang inklusif untuk setiap anak.</p>
                            <p style={{ marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.85rem' }}>Mari kita ciptakan momen bermain yang tak terlupakan bersama-sama!</p>
                        </div>
                        <button 
                            className={`sound-button ${isPlayingSound ? 'loading' : ''}`} 
                            onClick={playWelcomeSound}
                            disabled={isPlayingSound}
                        >
                            <IconSound /> {isPlayingSound ? 'Memutar...' : 'Dengarkan Sambutan'}
                        </button>
                    </div>
                </div>
            );
            case 'schedule': return (
                <div className="screen">
                    <h2>Jadwal Kegiatan</h2>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', height: '450px' }}>
                        <iframe 
                            src="https://calendar.google.com/calendar/embed?src=en.indonesian%23holiday%40group.v.calendar.google.com&ctz=Asia%2FJakarta" 
                            style={{ border: 0, width: '100%', height: '100%' }} 
                            frameBorder="0" 
                            scrolling="no"
                        ></iframe>
                    </div>
                </div>
            );
            case 'ideas': return (
                <div className="screen">
                    <h2>Ide Bermain (120+)</h2>
                    <div className="list">
                        {PlayIdeasData.slice(0, 15).map(idea => (
                            <div key={idea.id} className="card idea-card">
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
                                    <span style={{fontSize: '1.8rem'}}>{idea.emoji}</span>
                                    <h3 style={{fontSize: '1rem'}}>{idea.title}</h3>
                                </div>
                                <p style={{marginTop: '0.5rem', fontSize: '0.85rem'}}>{idea.description}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <a href={idea.youtubeUrl} target="_blank" className="btn-resource youtube">YouTube</a>
                                    <a href={idea.pinterestUrl} target="_blank" className="btn-resource pinterest">Pinterest</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'evaluation': return <EvaluationScreen />;
            case 'referensi': return <ReferenceScreen />;
            case 'members': return <MembersScreen onChat={setActiveChat} />;
            case 'konsultasi': return (
                <div className="screen">
                    <h2>Pusat Konsultasi Guru</h2>
                    <div className="list">
                        {teachers.map(t => (
                            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={t.avatar} alt={t.name} style={{ width: '50px', height: '50px', borderRadius: '25px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '0.95rem' }}>{t.name}</h3>
                                    <p style={{ fontSize: '0.7rem', color: t.id > 200 ? 'var(--brand-pink)' : '#666' }}>{t.id > 200 ? 'Expert' : 'Registered Guru'}</p>
                                </div>
                                <button onClick={() => setActiveChat(t)} className="profile-btn outline" style={{ width: 'auto', padding: '0.4rem 0.8rem' }}>Message</button>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'profile': return <ProfileScreen userProfile={userProfile} onMessage={setActiveChat} />;
        }
    };

    return (
        <div className="app-container">
            <header className="app-header"><h1>hyplay.id</h1></header>
            <main className="content-area">{renderTab()}</main>
            <nav className="tab-bar">
                <button className={`nav-item ${activeTab==='home' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('home'); setActiveChat(null);}}><IconHome /><span>Home</span></button>
                <button className={`nav-item ${activeTab==='schedule' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('schedule'); setActiveChat(null);}}><IconCalendar /><span>Jadwal</span></button>
                <button className={`nav-item ${activeTab==='ideas' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('ideas'); setActiveChat(null);}}><IconBulb /><span>Ide</span></button>
                <button className={`nav-item ${activeTab==='referensi' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('referensi'); setActiveChat(null);}}><IconMap /><span>Playdate</span></button>
                <button className={`nav-item ${activeTab==='members' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('members'); setActiveChat(null);}}><IconUsers /><span>Member</span></button>
                <button className={`nav-item ${activeTab==='evaluation' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('evaluation'); setActiveChat(null);}}><IconClipboard /><span>Evaluasi</span></button>
                <button className={`nav-item ${activeTab==='konsultasi' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('konsultasi'); setActiveChat(null);}}><IconKonsultasi /><span>Konsul</span></button>
                <button className={`nav-item ${activeTab==='profile' && !activeChat ?'active':''}`} onClick={()=>{setActiveTab('profile'); setActiveChat(null);}}><IconUser /><span>Profil</span></button>
            </nav>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
