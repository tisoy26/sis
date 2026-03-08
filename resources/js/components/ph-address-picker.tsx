import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const PSGC_BASE = 'https://psgc.gitlab.io/api';

type GeoItem = { code: string; name: string };

export type AddressData = {
    region_code: string;
    region_name: string;
    province_code: string;
    province_name: string;
    city_code: string;
    city_name: string;
    barangay_code: string;
    barangay_name: string;
    street: string;
    zip_code: string;
};

type Props = {
    value: AddressData;
    onChange: (data: AddressData) => void;
    errors?: Partial<Record<keyof AddressData, string>>;
};

async function fetchGeo(url: string): Promise<GeoItem[]> {
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data as { code: string; name: string }[])
            .map((d) => ({ code: d.code, name: d.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}

export default function PhAddressPicker({ value, onChange, errors }: Props) {
    const [regions, setRegions] = useState<GeoItem[]>([]);
    const [provinces, setProvinces] = useState<GeoItem[]>([]);
    const [cities, setCities] = useState<GeoItem[]>([]);
    const [barangays, setBarangays] = useState<GeoItem[]>([]);

    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    // Load regions on mount
    useEffect(() => {
        setLoadingRegions(true);
        fetchGeo(`${PSGC_BASE}/regions/`).then((data) => {
            setRegions(data);
            setLoadingRegions(false);
        });
    }, []);

    // Load provinces when region changes (and restore on edit)
    useEffect(() => {
        if (!value.region_code) {
            setProvinces([]);
            return;
        }
        setLoadingProvinces(true);
        fetchGeo(`${PSGC_BASE}/regions/${value.region_code}/provinces/`).then((data) => {
            setProvinces(data);
            setLoadingProvinces(false);
        });
    }, [value.region_code]);

    // Load cities when province changes
    useEffect(() => {
        if (!value.province_code) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        fetchGeo(`${PSGC_BASE}/provinces/${value.province_code}/cities-municipalities/`).then((data) => {
            setCities(data);
            setLoadingCities(false);
        });
    }, [value.province_code]);

    // Load barangays when city changes
    useEffect(() => {
        if (!value.city_code) {
            setBarangays([]);
            return;
        }
        setLoadingBarangays(true);
        fetchGeo(`${PSGC_BASE}/cities-municipalities/${value.city_code}/barangays/`).then((data) => {
            setBarangays(data);
            setLoadingBarangays(false);
        });
    }, [value.city_code]);

    const handleRegionChange = useCallback(
        (code: string) => {
            const region = regions.find((r) => r.code === code);
            onChange({
                ...value,
                region_code: code,
                region_name: region?.name ?? '',
                province_code: '',
                province_name: '',
                city_code: '',
                city_name: '',
                barangay_code: '',
                barangay_name: '',
            });
        },
        [regions, value, onChange],
    );

    const handleProvinceChange = useCallback(
        (code: string) => {
            const province = provinces.find((p) => p.code === code);
            onChange({
                ...value,
                province_code: code,
                province_name: province?.name ?? '',
                city_code: '',
                city_name: '',
                barangay_code: '',
                barangay_name: '',
            });
        },
        [provinces, value, onChange],
    );

    const handleCityChange = useCallback(
        (code: string) => {
            const city = cities.find((c) => c.code === code);
            onChange({
                ...value,
                city_code: code,
                city_name: city?.name ?? '',
                barangay_code: '',
                barangay_name: '',
            });
        },
        [cities, value, onChange],
    );

    const handleBarangayChange = useCallback(
        (code: string) => {
            const barangay = barangays.find((b) => b.code === code);
            onChange({
                ...value,
                barangay_code: code,
                barangay_name: barangay?.name ?? '',
            });
        },
        [barangays, value, onChange],
    );

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {/* Region */}
            <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={value.region_code} onValueChange={handleRegionChange}>
                    <SelectTrigger id="region">
                        <SelectValue placeholder={loadingRegions ? 'Loading...' : 'Select region...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {regions.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                                {r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.region_code && <p className="text-xs text-destructive">{errors.region_code}</p>}
            </div>

            {/* Province */}
            <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                    value={value.province_code}
                    onValueChange={handleProvinceChange}
                    disabled={!value.region_code}
                >
                    <SelectTrigger id="province">
                        <SelectValue placeholder={loadingProvinces ? 'Loading...' : 'Select province...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.province_code && <p className="text-xs text-destructive">{errors.province_code}</p>}
            </div>

            {/* City / Municipality */}
            <div className="space-y-2">
                <Label htmlFor="city">City / Municipality</Label>
                <Select
                    value={value.city_code}
                    onValueChange={handleCityChange}
                    disabled={!value.province_code}
                >
                    <SelectTrigger id="city">
                        <SelectValue placeholder={loadingCities ? 'Loading...' : 'Select city...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {cities.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.city_code && <p className="text-xs text-destructive">{errors.city_code}</p>}
            </div>

            {/* Barangay */}
            <div className="space-y-2">
                <Label htmlFor="barangay">Barangay</Label>
                <Select
                    value={value.barangay_code}
                    onValueChange={handleBarangayChange}
                    disabled={!value.city_code}
                >
                    <SelectTrigger id="barangay">
                        <SelectValue placeholder={loadingBarangays ? 'Loading...' : 'Select barangay...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {barangays.map((b) => (
                            <SelectItem key={b.code} value={b.code}>
                                {b.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.barangay_code && <p className="text-xs text-destructive">{errors.barangay_code}</p>}
            </div>

            {/* Street */}
            <div className="space-y-2">
                <Label htmlFor="street">Street / House No.</Label>
                <Input
                    id="street"
                    value={value.street}
                    onChange={(e) => onChange({ ...value, street: e.target.value })}
                    placeholder="e.g. 123 Rizal St."
                />
                {errors?.street && <p className="text-xs text-destructive">{errors.street}</p>}
            </div>

            {/* Zip Code */}
            <div className="space-y-2">
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input
                    id="zip_code"
                    value={value.zip_code}
                    onChange={(e) => onChange({ ...value, zip_code: e.target.value })}
                    placeholder="e.g. 1000"
                />
                {errors?.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
            </div>
        </div>
    );
}
