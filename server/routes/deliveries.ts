import { Router } from 'express';
import { getDeliveries, getAllDeliveries, getAddressBook, getLogs, getUsers, getYmsWarehouses, getYmsDocks, getYmsWaitingAreas, getYmsDeliveries, getYmsDockOverrides, getYmsAlerts, getPalletBalances } from '../../src/db/queries';
import { getSetting } from '../../src/db/sqlite';

const router = Router();

// Function to build standard static state for Socket sync (also used via API)
export const buildStaticState = () => {
  return {
    addressBook: getAddressBook(),
    palletBalances: getPalletBalances(),
    logs: getLogs(),
    users: getUsers().map((u: any) => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    }),
    deliveries: getAllDeliveries(),
    companySettings: getSetting('companySettings', {}),
    settings: getSetting('settings', {}),
    yms: {
      warehouses: getYmsWarehouses(),
      docks: getYmsDocks(),
      waitingAreas: getYmsWaitingAreas(),
      deliveries: getYmsDeliveries(),
      dockOverrides: getYmsDockOverrides(),
      alerts: getYmsAlerts()
    }
  };
};

router.get("/state", (req, res) => {
  res.json(buildStaticState());
});

router.get("/deliveries", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = req.query.search as string || '';
  const type = req.query.type as string || 'all';
  const sort = req.query.sort as string || 'eta';
  const activeOnly = req.query.activeOnly === 'true';

  const data = getDeliveries(page, limit, search, type, sort, activeOnly);
  res.json(data);
});

router.get("/deliveries/all", (req, res) => {
  const data = getAllDeliveries();
  res.json(data);
});

export default router;
