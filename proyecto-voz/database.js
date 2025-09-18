const { Sequelize, DataTypes } = require('sequelize');

// Configuración de base de datos usando variable de entorno de Railway
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost:5432/voicemural', {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: console.log, // Para debug, luego cambiar a false
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

// Modelo para las grabaciones de voz
const VoiceNote = sequelize.define('VoiceNote', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    audioData: {
        type: DataTypes.TEXT, // Base64 encoded audio
        allowNull: false
    },
    audioFormat: {
        type: DataTypes.STRING,
        defaultValue: 'webm'
    },
    duration: {
        type: DataTypes.INTEGER, // Duration in milliseconds
        allowNull: true
    },
    colorIndex: {
        type: DataTypes.INTEGER,
        defaultValue: () => Math.floor(Math.random() * 8) + 1
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true // For basic analytics without personal identification
    }
}, {
    timestamps: true, // createdAt, updatedAt
    indexes: [
        {
            fields: ['expiresAt']
        },
        {
            fields: ['createdAt']
        }
    ]
});

// Función para limpiar notas expiradas
const cleanupExpiredNotes = async () => {
    try {
        const deletedCount = await VoiceNote.destroy({
            where: {
                expiresAt: {
                    [Sequelize.Op.lt]: new Date()
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${deletedCount} expired voice notes`);
        }
        
        return deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired notes:', error);
        return 0;
    }
};

// Función para mantener solo las últimas 20 notas
const maintainNoteLimit = async () => {
    try {
        const totalNotes = await VoiceNote.count();
        
        if (totalNotes > 20) {
            // Obtener las IDs de las notas más antiguas que sobrepasan el límite
            const notesToDelete = await VoiceNote.findAll({
                order: [['createdAt', 'ASC']],
                limit: totalNotes - 20,
                attributes: ['id']
            });
            
            const idsToDelete = notesToDelete.map(note => note.id);
            
            const deletedCount = await VoiceNote.destroy({
                where: {
                    id: idsToDelete
                }
            });
            
            if (deletedCount > 0) {
                console.log(`🗑️ Removed ${deletedCount} oldest notes to maintain 20 note limit`);
            }
            
            return deletedCount;
        }
        
        return 0;
    } catch (error) {
        console.error('Error maintaining note limit:', error);
        return 0;
    }
};

// Conectar a la base de datos
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connection established successfully');
        
        // Sincronizar modelos (crear tablas si no existen)
        await sequelize.sync();
        console.log('📊 Database models synchronized');
        
        // Limpiar notas expiradas al iniciar
        await cleanupExpiredNotes();
        await maintainNoteLimit();
        
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to database:', error);
        return false;
    }
};

// Configurar limpieza automática cada 5 minutos
const startCleanupScheduler = () => {
    setInterval(async () => {
        await cleanupExpiredNotes();
        await maintainNoteLimit();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('🕐 Cleanup scheduler started (runs every 5 minutes)');
};

module.exports = {
    sequelize,
    VoiceNote,
    connectDB,
    cleanupExpiredNotes,
    maintainNoteLimit,
    startCleanupScheduler
};