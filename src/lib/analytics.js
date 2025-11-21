import * as XLSX from 'xlsx';

export const parseDate = (value) => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    // Handle Excel serial number
    if (typeof value === 'number') {
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }
    return new Date(value);
};

export const calculateMetrics = (data) => {
    let totalDebit = 0;
    let totalCredit = 0;
    const regionData = {};
    const storeTypeData = {};
    const monthlyData = {};
    const departmentData = {};
    const accountData = {};

    data.forEach(row => {
        const debit = Number(row['借方金額'] || 0);
        const credit = Number(row['貸方金額'] || 0);
        const dept = row['部門名稱'] || 'Unknown';
        const region = row['region'] || 'Unknown';
        const storeType = row['storeType'] || 'Unknown';
        const date = parseDate(row['日期']);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        totalDebit += debit;
        totalCredit += credit;

        // Monthly aggregation
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthKey, debit: 0, credit: 0, net: 0, sortDate: date };
        }
        monthlyData[monthKey].debit += debit;
        monthlyData[monthKey].credit += credit;
        monthlyData[monthKey].net += (credit - debit);

        // Account aggregation
        const accountName = row['科目名稱'] || 'Unknown';
        const accountCode = String(row['科目代號'] || '');

        if (!accountData[accountName]) {
            accountData[accountName] = { name: accountName, code: accountCode, debit: 0, credit: 0 };
        }
        accountData[accountName].debit += debit;
        accountData[accountName].credit += credit;

        // Department aggregation
        if (!departmentData[dept]) {
            departmentData[dept] = { name: dept, debit: 0, credit: 0, net: 0 };
        }
        departmentData[dept].debit += debit;
        departmentData[dept].credit += credit;
        departmentData[dept].net += (credit - debit);

        // Region aggregation
        if (!regionData[region]) {
            regionData[region] = { name: region, debit: 0, credit: 0, net: 0 };
        }
        regionData[region].debit += debit;
        regionData[region].credit += credit;
        regionData[region].net += (credit - debit);

        // Store Type aggregation
        if (!storeTypeData[storeType]) {
            storeTypeData[storeType] = { name: storeType, debit: 0, credit: 0, net: 0 };
        }
        storeTypeData[storeType].debit += debit;
        storeTypeData[storeType].credit += credit;
        storeTypeData[storeType].net += (credit - debit);
    });

    // Convert to arrays and sort
    const monthlyChartData = Object.values(monthlyData)
        .sort((a, b) => a.sortDate - b.sortDate)
        .map(({ sortDate, ...rest }) => rest);

    // Top 5 Accounts by Revenue (Credit) - Filter by Account Code starting with '4'
    const topRevenueAccounts = Object.values(accountData)
        .filter(d => d.code.startsWith('4'))
        .sort((a, b) => b.credit - a.credit)
        .slice(0, 5)
        .map(d => ({ name: d.name, value: d.credit }));

    // Top 5 Accounts by Expenses (Debit) - Filter by Account Code starting with '5' or '6'
    const topExpenseAccounts = Object.values(accountData)
        .filter(d => d.code.startsWith('5') || d.code.startsWith('6'))
        .sort((a, b) => b.debit - a.debit)
        .slice(0, 5)
        .map(d => ({ name: d.name, value: d.debit }));

    // Top 5 Departments by Net Income
    const topProfitDepartments = Object.values(departmentData)
        .sort((a, b) => b.net - a.net)
        .slice(0, 5);

    // Top 5 Departments by Profit Margin
    // Filter out departments with 0 or negative revenue to avoid division by zero or weird margins
    const topMarginDepartments = Object.values(departmentData)
        .filter(d => d.credit > 0)
        .map(d => ({
            ...d,
            margin: (d.net / d.credit) * 100
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5);

    const regionChartData = Object.values(regionData)
        .sort((a, b) => b.net - a.net); // Sort by Net Income

    // Store Type Net Income Data
    // Store Type Net Income Data
    // For Pie Chart, values must be positive. We'll use absolute values for the slice size
    // but keep the real value for the tooltip.
    const storeTypeNetIncomeData = Object.values(storeTypeData)
        .map(d => ({
            name: d.name,
            value: Math.abs(d.net), // Absolute value for Pie Chart size
            realValue: d.net // Real value for display
        }))
        .filter(d => d.value > 0); // Filter out 0 values

    const netIncome = totalCredit - totalDebit;
    const profitMargin = totalCredit > 0 ? (netIncome / totalCredit) * 100 : 0;

    return {
        totalDebit,
        totalCredit,
        netIncome,
        profitMargin,
        monthlyChartData,
        topRevenueAccounts,
        topExpenseAccounts,
        topProfitDepartments,
        topMarginDepartments,
        regionChartData,
        storeTypeNetIncomeData // New
    };
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(value);
};

export const formatNumber = (value) => {
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(value);
};

export const generatePLStatement = (data) => {
    const plData = {
        revenue: { name: '營業收入', code: '4', value: 0, items: [] },
        costs: { name: '營業成本', code: '5', value: 0, items: [] },
        expenses: { name: '營業費用', code: '6', value: 0, items: [] },
        nonOperating: { name: '營業外收支', code: '7', value: 0, items: [] }
    };

    const accountGroups = {};

    data.forEach(row => {
        const debit = Number(row['借方金額'] || 0);
        const credit = Number(row['貸方金額'] || 0);
        const accountName = row['科目名稱'] || 'Unknown';
        const accountCode = String(row['科目代號'] || '');

        // Determine net amount based on account type
        // Revenue (4) & Non-Operating (7): Credit - Debit (usually Credit balance)
        // Costs (5) & Expenses (6): Debit - Credit (usually Debit balance)
        let net = 0;
        let type = '';

        if (accountCode.startsWith('4')) {
            type = 'revenue';
            net = credit - debit;
        } else if (accountCode.startsWith('5')) {
            type = 'costs';
            net = debit - credit;
        } else if (accountCode.startsWith('6')) {
            type = 'expenses';
            net = debit - credit;
        } else if (accountCode.startsWith('7')) {
            type = 'nonOperating';
            net = credit - debit; // Assuming 7 is mostly income/gain, but could be mixed. Let's stick to Credit-Debit for now.
        } else {
            return; // Skip other accounts
        }

        if (!accountGroups[accountCode]) {
            accountGroups[accountCode] = { name: accountName, code: accountCode, value: 0, type };
        }
        accountGroups[accountCode].value += net;
    });

    // Populate plData
    Object.values(accountGroups).forEach(item => {
        if (plData[item.type]) {
            plData[item.type].value += item.value;
            plData[item.type].items.push(item);
        }
    });

    // Sort items by code
    Object.values(plData).forEach(group => {
        group.items.sort((a, b) => a.code.localeCompare(b.code));
    });

    // Calculate totals
    const grossProfit = plData.revenue.value - plData.costs.value;
    const operatingIncome = grossProfit - plData.expenses.value;
    const netIncome = operatingIncome + plData.nonOperating.value;

    return {
        details: plData,
        grossProfit,
        operatingIncome,
        netIncome
    };
};
