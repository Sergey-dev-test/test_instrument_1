function MainPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div style={{
        background: 'white',
        padding: '12px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>
            📊 DB Manager
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            👤 admin
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '300px',
          background: 'white',
          borderRight: '1px solid #eee',
          padding: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '15px' }}>
            📁 Структура БД
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Дерево таблиц будет здесь...
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: '#f5f5f5'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
            Добро пожаловать в DB Manager
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Выберите таблицу для просмотра или создайте новую
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        background: 'white',
        padding: '8px 20px',
        borderTop: '1px solid #eee',
        fontSize: '12px',
        color: '#666'
      }}>
        Подключено: Не подключено
      </div>
    </div>
  )
}

export default MainPage
