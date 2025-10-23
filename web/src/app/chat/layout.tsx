export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      maxWidth: '100vw'
    }}>
      {children}
    </div>
  );
}
