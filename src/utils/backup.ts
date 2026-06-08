export async function backupData() {
  const { db, getSettings } = await import('../db');
  
  const students = await db.students.toArray();
  const classes = await db.classes.toArray();
  const fees = await db.fees.toArray();
  const notices = await db.notices.toArray();
  const settings = getSettings();

  const backupObj = {
    timestamp: new Date().toISOString(),
    settings,
    data: {
      students,
      classes,
      fees,
      notices
    }
  };

  const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `school_manager_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function restoreData(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupObj = JSON.parse(content);

        if (!backupObj || !backupObj.data) {
          throw new Error('Invalid backup file format');
        }

        const { db, saveSettings } = await import('../db');
        
        // Restore settings
        if (backupObj.settings) {
          saveSettings(backupObj.settings);
        }

        // Clear and restore data
        await db.transaction('rw', db.students, db.classes, db.fees, db.notices, async () => {
          await db.students.clear();
          await db.classes.clear();
          await db.fees.clear();
          await db.notices.clear();

          if (backupObj.data.students?.length) await db.students.bulkAdd(backupObj.data.students);
          if (backupObj.data.classes?.length) await db.classes.bulkAdd(backupObj.data.classes);
          if (backupObj.data.fees?.length) await db.fees.bulkAdd(backupObj.data.fees);
          if (backupObj.data.notices?.length) await db.notices.bulkAdd(backupObj.data.notices);
        });

        resolve(true);
      } catch (err) {
        console.error('Failed to restore data:', err);
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
