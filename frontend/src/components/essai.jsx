// Incrémenter le compteur de messages non lus uniquement si ce n'est pas moi qui envoie
if (from !== userId) {
  const otherUserId = from === userId ? to : from;
  setUnreadCounts((prev) => ({
    ...prev,
    [otherUserId]: (prev[otherUserId] || 0) + 1,
  }));
  
  // Mettre à jour également le statut hasUnreadMessage
  setContacts((prev) =>
    prev.map((contact) =>
      contact._id === otherUserId
        ? { ...contact, hasUnreadMessage: true }
        : contact
    )
  );
}
} // ← CETTE ACCOLADE FERMANTE MANQUANTE

socket.on("receiveMessage", handleNewMessage);