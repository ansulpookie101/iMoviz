import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleUserRound,
  Clock3,
  CreditCard,
  Film,
  MapPin,
  Menu,
  Minus,
  Play,
  Plus,
  Popcorn,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Movie = {
  title: string;
  genre: string;
  runtime: string;
  rating: string;
  image: string;
  description: string;
  accent: string;
  upcoming?: boolean;
};

type Snack = { name: string; detail: string; price: number; icon: string };
type Booking = { id: string; movie_title: string; show_date: string; show_time: string; seats: string[]; snacks: Snack[]; total: number };

const movies: Movie[] = [
  { title: 'The Last Signal', genre: 'Sci-fi · Thriller', runtime: '2h 08m', rating: '8.7', image: 'https://images.pexels.com/photos/30217126/pexels-photo-30217126.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', description: 'In a city that forgot the stars, one final transmission changes everything.', accent: '#c9a46a' },
  { title: 'Nocturne', genre: 'Mystery · Drama', runtime: '1h 54m', rating: '8.2', image: 'https://images.pexels.com/photos/7991523/pexels-photo-7991523.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', description: 'A pianist, a vanished song, and one night to uncover the truth.', accent: '#b77c7a' },
  { title: 'Wild Horizon', genre: 'Adventure', runtime: '2h 21m', rating: '7.9', image: 'https://images.pexels.com/photos/7266264/pexels-photo-7266264.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', description: 'Somewhere beyond the edge of the map, the journey becomes the story.', accent: '#879b77' },
  { title: 'After the Rain', genre: 'Romance · Drama', runtime: '1h 47m', rating: '8.0', image: 'https://images.pexels.com/photos/25746374/pexels-photo-25746374.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', description: 'Two strangers meet between departures and find a reason to stay.', accent: '#9a8295' },
];

const upcoming = [
  { ...movies[0], title: 'The Glass House', genre: 'Drama · 2027', image: 'https://images.pexels.com/photos/13226335/pexels-photo-13226335.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', accent: '#9b8c75', upcoming: true },
  { ...movies[1], title: 'Parallel Lines', genre: 'Sci-fi · 2027', image: 'https://images.pexels.com/photos/30217127/pexels-photo-30217127.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', accent: '#657a91', upcoming: true },
  { ...movies[2], title: 'Paper Moons', genre: 'Animation · 2027', image: 'https://images.pexels.com/photos/7234227/pexels-photo-7234227.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', accent: '#b49371', upcoming: true },
];

const showtimes = ['10:30 AM', '1:15 PM', '4:00 PM', '6:45 PM', '9:30 PM'];
const occupiedSeats = new Set(['A3', 'A4', 'B7', 'C2', 'C3', 'D5', 'E1', 'E2', 'F6', 'F7', 'G4', 'H8']);
const snacks: Snack[] = [
  { name: 'Classic Popcorn', detail: 'Sea salt · large', price: 7, icon: 'popcorn' },
  { name: 'Cola Duo', detail: 'Two chilled drinks', price: 9, icon: 'drink' },
  { name: 'Chocolate Bites', detail: 'Dark chocolate · 120g', price: 6, icon: 'chocolate' },
];

function App() {
  const [selectedMovie, setSelectedMovie] = useState<Movie>(movies[0]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<'showtime' | 'seats' | 'checkout' | 'success'>('showtime');
  const [selectedTime, setSelectedTime] = useState(showtimes[2]);
  const [selectedDate, setSelectedDate] = useState('Thu, Nov 05');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [snackCounts, setSnackCounts] = useState<Record<string, number>>({});
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setBookings([]);
      return;
    }
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setBookings(data as Booking[]);
    });
  }, [session]);

  const snackTotal = useMemo(() => snacks.reduce((total, snack) => total + snack.price * (snackCounts[snack.name] ?? 0), 0), [snackCounts]);
  const total = selectedSeats.length * 14 + snackTotal;
  const dates = ['Wed, Nov 04', 'Thu, Nov 05', 'Fri, Nov 06', 'Sat, Nov 07'];

  const openBooking = (movie: Movie) => {
    setSelectedMovie(movie);
    setBookingStep('showtime');
    setSelectedSeats([]);
    setSnackCounts({});
    setBookingOpen(true);
  };

  const toggleSeat = (seat: string) => {
    if (occupiedSeats.has(seat)) return;
    setSelectedSeats((current) => current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat]);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const result = authMode === 'sign-in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setAuthError(result.error.message);
    else setAuthOpen(false);
    setAuthBusy(false);
  };

  const completeBooking = async () => {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    const snackItems = snacks.filter((snack) => (snackCounts[snack.name] ?? 0) > 0).map((snack) => ({ ...snack, quantity: snackCounts[snack.name] }));
    const { data } = await supabase.from('bookings').insert({ movie_title: selectedMovie.title, show_date: selectedDate, show_time: selectedTime, seats: selectedSeats, snacks: snackItems, total }).select().maybeSingle();
    if (data) setBookings((current) => [data as Booking, ...current]);
    setBookingStep('success');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top"><img src="/logo.png" alt="iMoviz" /><span>iMoviz</span></a>
        <nav className="desktop-nav"><a href="#now-showing">Now showing</a><a href="#coming-soon">Coming soon</a><a href="#about">About us</a></nav>
        <div className="header-actions">
          <button className="icon-button mobile-only" onClick={() => setSearchOpen((open) => !open)} aria-label="Search"><Search size={18} /></button>
          <button className="account-button" onClick={() => session ? setAccountOpen(true) : setAuthOpen(true)}><CircleUserRound size={18} /><span>{session ? 'My account' : 'Sign in'}</span></button>
          <button className="menu-button mobile-only" aria-label="Menu"><Menu size={21} /></button>
        </div>
      </header>

      {searchOpen && <div className="search-bar"><Search size={17} /><input autoFocus placeholder="Search films, genres or times" /><button onClick={() => setSearchOpen(false)}><X size={18} /></button></div>}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> The cinema experience</p><h1>Stories worth<br /><em>staying for.</em></h1><p className="hero-text">Independent films, big-screen moments and a seat waiting for you at iMoviz.</p><div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' })}>Explore films <ArrowRight size={17} /></button><button className="text-button" onClick={() => openBooking(movies[0])}><Play size={15} fill="currentColor" /> Watch trailer</button></div></div>
          <div className="hero-art"><div className="hero-image-wrap"><img src="https://images.pexels.com/photos/7991381/pexels-photo-7991381.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Empty cinema seats facing a glowing screen" /><div className="hero-overlay" /></div><div className="hero-note"><span>Tonight at iMoviz</span><strong>Find your next<br />favorite film.</strong></div><div className="hero-rating"><span>iM</span><strong>4.9</strong><small>audience score</small></div></div>
        </section>

        <section className="info-strip"><div><MapPin size={17} /><span><strong>iMoviz Downtown</strong><small>One cinema. Every story.</small></span></div><div><CalendarDays size={17} /><span><strong>Open every day</strong><small>10:00 AM — 11:30 PM</small></span></div><div><ShieldCheck size={17} /><span><strong>Book with confidence</strong><small>Easy changes, secure checkout</small></span></div></section>

        <section className="content-section" id="now-showing"><div className="section-heading"><div><p className="eyebrow">On the big screen</p><h2>Now showing</h2></div><button className="view-all">View all films <ArrowRight size={16} /></button></div><div className="movie-grid">{movies.map((movie) => <MovieCard key={movie.title} movie={movie} onBook={() => openBooking(movie)} />)}</div></section>

        <section className="feature-band"><div className="feature-image"><img src="https://images.pexels.com/photos/7234386/pexels-photo-7234386.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Fresh popcorn in a cinema bucket" /></div><div className="feature-copy"><p className="eyebrow">Make it a night out</p><h2>Good films taste<br /><em>better together.</em></h2><p>Pre-order your favorite cinema snacks and we’ll have them ready when you take your seat.</p><button className="primary-button" onClick={() => openBooking(movies[1])}>Plan your visit <ArrowRight size={17} /></button></div></section>

        <section className="content-section upcoming-section" id="coming-soon"><div className="section-heading"><div><p className="eyebrow">Save the date</p><h2>Coming soon</h2></div><button className="view-all">See full calendar <ArrowRight size={16} /></button></div><div className="upcoming-grid">{upcoming.map((movie) => <MovieCard key={movie.title} movie={movie} onBook={() => openBooking(movie)} />)}</div></section>

        <section className="newsletter" id="about"><div><p className="eyebrow">The iMoviz note</p><h2>Stay in the picture.</h2><p>Get occasional notes on new releases, special screenings and the best seats in the house.</p></div><div className="newsletter-form"><input placeholder="Your email address" type="email" /><button className="primary-button">Subscribe <ArrowRight size={17} /></button></div></section>
      </main>

      <footer className="site-footer"><div className="brand footer-brand"><img src="/logo.png" alt="" /><span>iMoviz</span></div><p>One cinema. Every story.</p><div className="footer-links"><a href="#now-showing">Films</a><a href="#coming-soon">Coming soon</a><a href="#about">Contact</a></div></footer>

      {bookingOpen && <BookingModal movie={selectedMovie} step={bookingStep} setStep={setBookingStep} dates={dates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} selectedSeats={selectedSeats} toggleSeat={toggleSeat} snackCounts={snackCounts} setSnackCounts={setSnackCounts} total={total} onClose={() => setBookingOpen(false)} onComplete={completeBooking} session={session} onSignIn={() => setAuthOpen(true)} />}
      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSubmit={submitAuth} error={authError} busy={authBusy} />}
      {accountOpen && <AccountModal session={session} bookings={bookings} onClose={() => setAccountOpen(false)} onSignOut={() => { supabase.auth.signOut(); setAccountOpen(false); }} />}
    </div>
  );
}

function MovieCard({ movie, onBook }: { movie: Movie; onBook: () => void }) {
  return <article className="movie-card"><div className="poster"><img src={movie.image} alt={movie.title} /><div className="poster-shade" /><span className="score">★ {movie.rating}</span>{movie.upcoming && <span className="coming-label">Coming soon</span>}<button className="poster-play" onClick={onBook}><Play size={16} fill="currentColor" /></button></div><div className="movie-meta"><div><h3>{movie.title}</h3><p>{movie.genre} <span>·</span> {movie.runtime}</p></div><button className="small-book" onClick={onBook}>Book</button></div></article>;
}

function BookingModal({ movie, step, setStep, dates, selectedDate, setSelectedDate, selectedTime, setSelectedTime, selectedSeats, toggleSeat, snackCounts, setSnackCounts, total, onClose, onComplete, session, onSignIn }: { movie: Movie; step: 'showtime' | 'seats' | 'checkout' | 'success'; setStep: (step: 'showtime' | 'seats' | 'checkout' | 'success') => void; dates: string[]; selectedDate: string; setSelectedDate: (date: string) => void; selectedTime: string; setSelectedTime: (time: string) => void; selectedSeats: string[]; toggleSeat: (seat: string) => void; snackCounts: Record<string, number>; setSnackCounts: (counts: Record<string, number>) => void; total: number; onClose: () => void; onComplete: () => void; session: Session | null; onSignIn: () => void }) {
  const next = () => setStep(step === 'showtime' ? 'seats' : 'checkout');
  return <div className="modal-backdrop"><div className="booking-modal"><div className="modal-top"><div><p className="eyebrow">Reserve your seat</p><h2>{step === 'success' ? 'You’re all set.' : movie.title}</h2></div><button className="close-button" onClick={onClose}><X size={20} /></button></div>{step !== 'success' && <div className="stepper"><span className="active">01 <small>Showtime</small></span><span className={step !== 'showtime' ? 'active' : ''}>02 <small>Seats</small></span><span className={step === 'checkout' ? 'active' : ''}>03 <small>Checkout</small></span></div>}{step === 'showtime' && <div className="booking-content"><div className="booking-film"><img src={movie.image} alt="" /><div><strong>{movie.genre}</strong><p>{movie.description}</p><span><Clock3 size={14} /> {movie.runtime}</span></div></div><div className="picker-group"><label>Choose a date</label><div className="date-grid">{dates.map((date) => <button className={date === selectedDate ? 'selected' : ''} onClick={() => setSelectedDate(date)} key={date}>{date.split(',')[0]}<strong>{date.split(' ')[2]}</strong></button>)}</div></div><div className="picker-group"><label>Choose a session</label><div className="time-grid">{showtimes.map((time) => <button className={time === selectedTime ? 'selected' : ''} onClick={() => setSelectedTime(time)} key={time}>{time}</button>)}</div></div><button className="primary-button full-button" onClick={next}>Choose seats <ArrowRight size={17} /></button></div>}{step === 'seats' && <div className="booking-content"><div className="screen-label"><span /> Screen <span /></div><div className="seat-map">{['A','B','C','D','E','F','G','H'].map((row) => <div className="seat-row" key={row}><small>{row}</small>{Array.from({ length: 8 }, (_, index) => { const seat = `${row}${index + 1}`; return <button key={seat} aria-label={seat} className={`${occupiedSeats.has(seat) ? 'occupied' : ''} ${selectedSeats.includes(seat) ? 'chosen' : ''}`} onClick={() => toggleSeat(seat)}>{index + 1}</button>; })}</div>)}</div><div className="seat-legend"><span><i className="available" /> Available</span><span><i className="chosen-dot" /> Selected</span><span><i className="occupied-dot" /> Occupied</span></div><div className="booking-summary"><span>{selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'} selected</span><strong>${selectedSeats.length * 14}</strong></div><button className="primary-button full-button" disabled={!selectedSeats.length} onClick={next}>Continue to snacks <ArrowRight size={17} /></button></div>}{step === 'checkout' && <div className="booking-content"><div className="checkout-heading"><div><p className="eyebrow">Almost there</p><h3>Your cinema order</h3></div><span className="total-price">${total}</span></div><div className="order-line"><span><Ticket size={17} /> {selectedSeats.join(', ')} <small>{selectedDate} · {selectedTime}</small></span><strong>${selectedSeats.length * 14}</strong></div><div className="snack-list">{snacks.map((snack) => <div className="snack-row" key={snack.name}><div className="snack-icon"><Popcorn size={18} /></div><span><strong>{snack.name}</strong><small>{snack.detail} · ${snack.price}</small></span><div className="quantity"><button onClick={() => setSnackCounts({ ...snackCounts, [snack.name]: Math.max(0, (snackCounts[snack.name] ?? 0) - 1) })}><Minus size={14} /></button><span>{snackCounts[snack.name] ?? 0}</span><button onClick={() => setSnackCounts({ ...snackCounts, [snack.name]: (snackCounts[snack.name] ?? 0) + 1 })}><Plus size={14} /></button></div></div>)}</div>{!session && <div className="sign-in-callout"><UserRound size={18} /><span><strong>Sign in to finish your booking</strong><small>Your ticket will be saved to your account.</small></span><button onClick={onSignIn}>Sign in</button></div>}<button className="primary-button full-button" onClick={onComplete}><CreditCard size={17} /> {session ? `Confirm booking · $${total}` : 'Sign in to confirm'} </button><p className="secure-note"><ShieldCheck size={14} /> Secure reservation. No payment is taken in this preview.</p></div>}{step === 'success' && <div className="success-state"><div className="success-icon"><Check size={30} /></div><h3>Your ticket is ready</h3><p>We’ve reserved {selectedSeats.join(', ')} for {movie.title} on {selectedDate} at {selectedTime}.</p><div className="ticket-card"><QrCode size={86} /><div><strong>iMoviz · Downtown</strong><span>{selectedDate} · {selectedTime}</span><span>{selectedSeats.length} {selectedSeats.length === 1 ? 'ticket' : 'tickets'}</span></div></div><button className="primary-button full-button" onClick={onClose}>Done</button></div>}</div></div>;
}

function AuthModal({ mode, setMode, onClose, onSubmit, error, busy }: { mode: 'sign-in' | 'sign-up'; setMode: (mode: 'sign-in' | 'sign-up') => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string; busy: boolean }) {
  return <div className="modal-backdrop"><div className="auth-modal"><button className="close-button" onClick={onClose}><X size={20} /></button><img src="/logo.png" alt="iMoviz" /><p className="eyebrow">Your place in the story</p><h2>{mode === 'sign-in' ? 'Welcome back.' : 'Join iMoviz.'}</h2><p className="auth-subtitle">{mode === 'sign-in' ? 'Sign in to see your tickets and upcoming bookings.' : 'Create an account to keep every cinema night in one place.'}</p><form onSubmit={onSubmit}><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength={6} placeholder="At least 6 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><p className="auth-switch">{mode === 'sign-in' ? 'New to iMoviz?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</button></p></div></div>;
}

function AccountModal({ session, bookings, onClose, onSignOut }: { session: Session | null; bookings: Booking[]; onClose: () => void; onSignOut: () => void }) {
  return <div className="modal-backdrop"><div className="account-modal"><div className="modal-top"><div><p className="eyebrow">Your iMoviz</p><h2>My account</h2></div><button className="close-button" onClick={onClose}><X size={20} /></button></div><div className="account-profile"><div className="avatar">{session?.user.email?.[0].toUpperCase()}</div><div><strong>{session?.user.email}</strong><span>Member since today</span></div><button onClick={onSignOut}>Sign out</button></div><h3>Upcoming & past tickets</h3>{bookings.length ? <div className="booking-history">{bookings.map((booking) => <div className="history-row" key={booking.id}><div className="history-icon"><Ticket size={18} /></div><div><strong>{booking.movie_title}</strong><span>{booking.show_date} · {booking.show_time} · {booking.seats.join(', ')}</span></div><b>${booking.total}</b></div>)}</div> : <div className="empty-history"><Film size={22} /><p>Your tickets will appear here after you book a film.</p></div>}</div></div>;
}

export default App;
