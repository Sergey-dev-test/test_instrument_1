const API_URL = '/api';

/**
 * Кастомный Data Provider для React-Admin
 */
const dataProvider = {
  /**
   *getList - получение списка записей с пагинацией
   */
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const { q } = params.filter;

    let url = `${API_URL}/table/${resource}?page=${page}&limit=${perPage}`;
    
    if (field && order) {
      url += `&sort=${field}&order=${order}`;
    }
    
    if (q) {
      url += `&search=${q}`;
    }

    const response = await fetch(url);
    const { data, total } = await response.json();

    return {
      data: data,
      total: total,
    };
  },

  /**
   *getOne - получение одной записи
   */
  getOne: async (resource, params) => {
    const response = await fetch(`${API_URL}/table/${resource}`);
    const { data } = await response.json();
    const record = data.find(item => item.id === params.id);

    if (!record) {
      throw new Error(`Record not found for id ${params.id}`);
    }

    return {
      data: record,
    };
  },

  /**
   *create - создание новой записи
   */
  create: async (resource, params) => {
    const response = await fetch(`${API_URL}/table/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();

    return {
      data: { ...result.data, id: result.data.id },
    };
  },

  /**
   *update - обновление записи (заблокировано)
   */
  update: async (resource, params) => {
    const response = await fetch(`${API_URL}/table/${resource}/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 403) {
      throw new Error('Обновление существующих записей запрещено');
    }

    const result = await response.json();
    return {
      data: { ...params.previousData, ...result.data },
    };
  },

  /**
   *delete - удаление записи (заблокировано)
   */
  delete: async (resource, params) => {
    const response = await fetch(`${API_URL}/table/${resource}/${params.id}`, {
      method: 'DELETE',
    });

    if (response.status === 405) {
      throw new Error('Удаление записей запрещено');
    }

    return {
      data: params.previousData,
    };
  },

  /**
   *getMany - получение нескольких записей
   */
  getMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map(id =>
        fetch(`${API_URL}/table/${resource}`).then(r => r.json())
      )
    );

    const allData = responses.flatMap(r => r.data);
    const data = params.ids.map(id => allData.find(item => item.id === id));

    return { data };
  },

  /**
   *getManyReference - получение записей по связи
   */
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const { target, id } = params.filter;

    let url = `${API_URL}/table/${resource}?page=${page}&limit=${perPage}`;
    
    if (field && order) {
      url += `&sort=${field}&order=${order}`;
    }
    
    if (target && id) {
      url += `&filter=${target}=${id}`;
    }

    const response = await fetch(url);
    const { data, total } = await response.json();

    return {
      data: data,
      total: total,
    };
  },

  /**
   *getListForSelect - получение списка для выпадающего списка (FK)
   */
  getListForSelect: async (resource) => {
    const response = await fetch(`${API_URL}/table/${resource}?limit=1000`);
    const { data } = await response.json();

    return {
      data: data,
    };
  },
};

export default dataProvider;
