import R from 'ramda'

const add = (next, variant, field) => {
  if (!next[field]) {
    return Number(variant[field])
  }
  return Number(next[field]) + Number(variant[field])
}

const addNested = (next, variant, field) => {
  if (!variant[field]) return
  const keys = Object.keys(variant[field])
  if (!next[field]) return variant[field]
  return keys.reduce((acc, key) => ({
    ...acc,
    [key]: next[field][key] + variant[field][key]
  }), {})
}

/**
 * `combineVariantData` takes an array of variants and
 * stores/combines/sums fields based on a fields object. Variants
 * with identical `variant_id` fields are reduced under a single
 * index with original datasets preserved under field `dataset`
 * with summed/common data at the top level of the object and also
 * stored under 'all'
 * @param {object} fields what to do with each field
 * @param {array} variants variants from multiple datasets
 * @returns {object} variantsCombined indexed by variant_id
*/

const combineVariantData = R.curry((fields, variants) => R.reduce((acc, variant) => {
  const { variant_id } = variant
  const next = { ...acc[variant_id] }
  if (next['datasets'] && variant.dataset === 'gnomAD') {
    // skip constants if exac fields already available
  } else {
    fields.constantFields.forEach(field =>
      next[field] = variant[field])
  }
  fields.sumFields.forEach(field =>
    next[field] = add(next, variant, field))
  fields.nestedSumFields.forEach(field =>
    next[field] = addNested(next, variant, field))
  next['allele_freq'] = next.allele_count / next.allele_num
  if (!next['datasets']) {
    next['datasets'] = ['all', variant.dataset]
  } else {
    next['datasets'] = [...next['datasets'], variant.dataset]
  }
  next[variant.dataset] = fields.uniqueFields.reduce((acc, field) => ({
    ...acc,
    [field]: variant[field]
  }), {})
  next.all = fields.uniqueFields.reduce((acc, field) => ({
    ...acc,
    [field]: next[field]
  }), {})
  return {
    ...acc,
    [variant_id]: next,
  }
}, {})(variants))

export default combineVariantData
