const db = require('../../../utils/database');

const Procurement = db.Procurement;
class ProcurementRepository {

  // ================= CREATE SINGLE =================
  async create(data) {
    try {
      console.log("procurement model", Procurement)
      console.log("data at procurement repo : ", data);
      return await Procurement.create(data);
    } catch (error) {
      console.error("❌ Procurement Create Error:", error.message);
      throw new Error("Failed to create procurement");
    }
  }

  // ================= BULK CREATE =================
  async bulkCreate(dataArray) {
    try {
      return await Procurement.bulkCreate(dataArray, {
        validate: true
      });
    } catch (error) {
      console.error("❌ Procurement Bulk Error:", error.message);
      throw new Error("Failed bulk insert");
    }
  }

  // ================= FIND BY ID =================
  async findById(id) {
    try {
      return await Procurement.findByPk(id);
    } catch (error) {
      console.error("❌ FindById Error:", error.message);
      throw new Error("Failed to fetch procurement");
    }
  }

  // ================= GET ALL =================
  async findAll(options = {}) {
    try {
      if (options.page || options.limit) {
        const page = Math.max(1, Number(options.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
        const { count, rows } = await Procurement.findAndCountAll({
          order: [['created_at', 'DESC']],
          limit,
          offset: (page - 1) * limit,
        });
        return { rows, total: count, page, limit, pages: Math.ceil(count / limit) };
      }

      const data = await Procurement.findAll({
        order: [['created_at', 'DESC']]
      });
      console.log("data from the repo procurement : " , data);
      return data;
    } catch (error) {
      console.error("❌ FindAll Error:", error.message);
      throw new Error("Failed to fetch procurements");
    }
  }

  // ================= UPDATE =================
  async update(id, data) {
    try {
      const record = await Procurement.findByPk(id);
      if (!record) return null;

      return await record.update(data);
    } catch (error) {
      console.error("❌ Update Error:", error.message);
      throw new Error("Failed to update procurement");
    }
  }


}

module.exports = new ProcurementRepository();