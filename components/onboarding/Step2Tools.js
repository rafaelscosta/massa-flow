import styles from '../../styles/Onboarding.module.css'; // Shared onboarding styles
import { trackFrontendEvent } from '../../lib/frontendAnalytics';

const toolsOptions = [
  { id: 'google_calendar', name: 'Google Agenda', logo: '/icons/google-calendar.png' },
  { id: 'whatsapp_business', name: 'WhatsApp Business', logo: '/icons/whatsapp.png' },
  { id: 'email', name: 'E-mail (Gmail/Outlook)', logo: '/icons/email.png' },
];

export default function Step2Tools({ data, updateData, userId }) {
  const handleToolConnect = (toolId, toolName) => {
    const currentTools = data.toolsConnected || [];
    // For this MVP, clicking "Conectar" simply adds it to the list.
    if (!currentTools.includes(toolId)) {
      const newTools = [...currentTools, toolId];
      updateData({ toolsConnected: newTools });
      trackFrontendEvent(
        'onboarding_tools_configured', // This event name might be better at the end of the step
                                         // Or, use a more specific event like 'tool_connection_updated'
        { tool_name: toolName, status: 'connected', context: 'onboarding' },
        userId
      );
    }
  };

  const isConnected = (toolId) => (data.toolsConnected || []).includes(toolId);
  // Similar to objectives, the final list of `tools_connected` will be captured
  // by the `onboarding_completed` event. Granular `tool_connection_updated` within onboarding
  // is also an option as shown above.

  return (
    <>
      <h2 className={styles.stepTitle}>Conecte suas ferramentas</h2>
      <p className={styles.stepSubtitle}>
        Integre as ferramentas que você já utiliza para automatizar seu fluxo de trabalho.
        Não se preocupe, você poderá adicionar ou remover integrações a qualquer momento.
      </p>
      <div className={styles.toolsGrid}>
        {toolsOptions.map((tool) => (
          <div key={tool.id} className={styles.toolCard}>
            <img src={tool.logo} alt={`${tool.name} logo`} className={styles.toolLogo} />
            <h3>{tool.name}</h3>
            {isConnected(tool.id) ? (
              <p className={styles.statusText}>Conectado!</p>
            ) : (
              <button
                onClick={() => handleToolConnect(tool.id)}
                className={`${styles.connectButton} ${styles.disconnected}`}
              >
                Conectar
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
