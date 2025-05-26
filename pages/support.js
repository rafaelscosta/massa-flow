import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Support.module.css'; // To be created
import { trackFrontendEvent } from '../lib/frontendAnalytics';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

const TicketForm = ({ onTicketCreated }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    if (!subject.trim() || !description.trim()) {
      setFormError('Assunto e Descrição são obrigatórios.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: MVP_USER_ID, 
          subject, 
          description, 
          category, 
          priority 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar o ticket.');
      }

      setFormSuccess(`Ticket #${data.id.split('_').pop()} criado com sucesso! Nossa equipe responderá em breve.`);
      setSubject('');
      setDescription('');
      setCategory('technical');
      setPriority('normal');
      if (onTicketCreated) onTicketCreated(); // Callback to refresh list
      
      trackFrontendEvent('support_ticket_submitted', {
        userId: MVP_USER_ID,
        category,
        priority,
      });

    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.ticketForm}>
      <h2>Abrir Novo Ticket de Suporte</h2>
      {formError && <p className={styles.formError}>{formError}</p>}
      {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
      
      <div className={styles.formGroup}>
        <label htmlFor="subject">Assunto</label>
        <input 
          type="text" 
          id="subject" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          required 
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description">Descrição Detalhada</label>
        <textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows="5" 
          required 
        />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="category">Categoria</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="technical">Técnico</option>
            <option value="billing">Cobrança</option>
            <option value="feedback">Feedback</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="priority">Prioridade</label>
          <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={submitting} className={styles.submitButton}>
        {submitting ? 'Enviando...' : 'Enviar Ticket'}
      </button>
    </form>
  );
};

const TicketList = ({ tickets, loading, error, onTicketSelect, selectedTicketId }) => {
  if (loading) return <p>Carregando seus tickets...</p>;
  if (error) return <p className={styles.error}>Erro ao carregar tickets: {error}</p>;
  if (tickets.length === 0) return <p className={styles.noTickets}>Você ainda não abriu nenhum ticket de suporte.</p>;

  const getPriorityClass = (priority) => {
    if (priority === 'high') return styles.priorityHigh;
    if (priority === 'low') return styles.priorityLow;
    return styles.priorityNormal;
  };
  
  const getStatusClass = (status) => {
    if (status === 'open') return styles.statusOpen;
    if (status === 'in_progress') return styles.statusInProgress;
    if (status === 'resolved' || status === 'closed') return styles.statusClosed;
    return '';
  };

  return (
    <div className={styles.ticketListContainer}>
      <h2>Meus Tickets</h2>
      <ul className={styles.ticketList}>
        {tickets.map(ticket => (
          <li 
            key={ticket.id} 
            className={`${styles.ticketItem} ${selectedTicketId === ticket.id ? styles.selectedTicket : ''}`}
            onClick={() => onTicketSelect(ticket.id)}
          >
            <div className={styles.ticketHeader}>
              <span className={styles.ticketSubject}>{ticket.subject}</span>
              <span className={`${styles.ticketStatus} ${getStatusClass(ticket.status)}`}>{ticket.status.toUpperCase()}</span>
            </div>
            <div className={styles.ticketDetails}>
              <span>ID: #{ticket.id.split('_').pop()}</span>
              <span className={styles.ticketCategory}>{ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}</span>
              <span className={`${styles.ticketPriority} ${getPriorityClass(ticket.priority)}`}>Prioridade: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</span>
              <span>Criado em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {selectedTicketId === ticket.id && (
                <div className={styles.ticketDescriptionExpanded}>
                    <p><strong>Descrição:</strong></p>
                    <p>{ticket.description}</p>
                    {/* Future: Display replies here */}
                </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};


export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    setFetchError('');
    try {
      const response = await fetch(`/api/support/tickets?userId=${MVP_USER_ID}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar tickets.');
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'support_page', userId: MVP_USER_ID });
    fetchTickets();
  }, []);
  
  const handleTicketSelect = (ticketId) => {
    setSelectedTicketId(prevId => prevId === ticketId ? null : ticketId); // Toggle selection
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Suporte ao Cliente</title>
        <meta name="description" content="Abra e gerencie seus tickets de suporte no MassaFlow." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Central de Suporte</h1>
        
        <TicketForm onTicketCreated={fetchTickets} /> {/* Pass callback to refresh list */}
        
        <TicketList 
            tickets={tickets} 
            loading={loadingTickets} 
            error={fetchError}
            onTicketSelect={handleTicketSelect}
            selectedTicketId={selectedTicketId}
        />
      </main>
    </div>
  );
}
