const io = require("socket.io-client");
const socket = io("http://localhost:3000", { query: { token: 'admin_mock_token' } });

socket.on('connect', () => {
  console.log("Connected");
  
  // Create a delivery first to have it in the DB
  const mockId = Math.random().toString(36).substring(2, 10);
  const mainMockId = Math.random().toString(36).substring(2, 10);
  
  socket.emit('action', {
    type: 'ADD_DELIVERY',
    payload: {
      id: mainMockId,
      reference: 'TEST-PALLET-1',
      status: 90, // UNLOADING
      type: 'container',
      supplierId: 'sup-1',
      palletCount: 30
    }
  });

  setTimeout(() => {
    // Send YMS_SAVE_DELIVERY directly
    socket.emit('action', {
      type: 'YMS_SAVE_DELIVERY',
      payload: {
        id: mockId,
        mainDeliveryId: mainMockId,
        reference: 'TEST-PALLET-1',
        status: 'COMPLETED',
        palletsExchanged: 40,
        isPalletExchangeConfirmed: true,
        palletType: 'EUR',
        palletRate: 15
      }
    });

    setTimeout(() => {
       console.log("Done");
       process.exit(0);
    }, 1000);
  }, 1000);
});
