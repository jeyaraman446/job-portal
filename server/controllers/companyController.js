const Company = require('../models/Company');
const User = require('../models/User');

exports.registerCompany = async (req, res) => {
  try {
    const hr = await User.findById(req.user.id);
    if (hr.company) return res.status(400).json({ message: 'You have already registered a company' });

    const { name, website, industry, size, location, logoUrl, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Company name is required' });

    const company = await Company.create({
      name: name.trim(),
      website: website ? website.trim() : '',
      industry: industry ? industry.trim() : '',
      size: size ? size.trim() : '',
      location: location ? location.trim() : '',
      logoUrl: logoUrl ? logoUrl.trim() : '',
      description: description ? description.trim() : '',
      registeredBy: hr._id,
    });

    hr.company = company._id;
    await hr.save();
    res.status(201).json(company);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'A company with this name is already registered' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const hr = await User.findById(req.user.id);
    if (!hr.company) return res.status(404).json({ message: 'No company registered' });

    const { name, website, industry, size, location, logoUrl, description } = req.body;
    const company = await Company.findById(hr.company);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (name) company.name = name.trim();
    if (website !== undefined) company.website = website.trim();
    if (industry !== undefined) company.industry = industry.trim();
    if (size !== undefined) company.size = size.trim();
    if (location !== undefined) company.location = location.trim();
    if (logoUrl !== undefined) company.logoUrl = logoUrl.trim();
    if (description !== undefined) company.description = description.trim();

    await company.save();
    res.json(company);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'A company with this name already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.getMyCompany = async (req, res) => {
  try {
    const hr = await User.findById(req.user.id).populate('company');
    res.json(hr.company || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
