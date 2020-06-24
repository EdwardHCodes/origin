import { IEnvironment } from '../features/general';
import { Bundle } from './exchange';
import { deviceById, EnergyFormatter } from '.';
import { BigNumber } from 'ethers/utils';
import { EnergyTypes } from './device';

export const energyByType = (
    bundle: Bundle,
    environment: IEnvironment,
    devices,
    types: EnergyTypes[] = Object.values(EnergyTypes)
) => {
    return bundle.items.reduce(
        (grouped, item) => {
            const type = deviceById(item.asset.deviceId, environment, devices)
                .deviceType.split(';')[0]
                .toLowerCase();
            const propName = grouped[type] ? type : 'other';
            grouped[propName] = grouped[propName].add(item.currentVolume);
            grouped.total = grouped.total.add(item.currentVolume);
            return grouped;
        },
        types.reduce((acc, type) => ({ ...acc, [type]: new BigNumber(0) }), {
            total: new BigNumber(0),
            other: new BigNumber(0)
        })
    );
};

export const energyShares = (
    bundle: Bundle,
    environment: IEnvironment,
    devices,
    types: EnergyTypes[]
) => {
    const energy = energyByType(bundle, environment, devices, types);
    return Object.fromEntries(
        Object.keys(energy)
            .filter((p) => p !== 'total')
            .map((p) => [p, energy[p].mul(new BigNumber(10000)).div(energy.total)])
            .map(([p, v]) => {
                return [p, `${(v.toNumber() / 100).toFixed(2)}%`];
            })
            .concat([['total', EnergyFormatter.format(energy.total, true)]])
    );
};

export const bundlePrice = (bundle: Bundle) =>
    (bundle.price * Number(EnergyFormatter.format(bundle.volume, false))) / 100;