module ApplicationHelper
  # NOTE: this is somewhat similar to RoutingStore.js by necessity
  def frontend_url_for(obj)
    return admin_root_url if obj == Role::SHAPE_ADMIN.to_s.titleize

    url = "#{root_url}#{obj.organization.slug}/"
    if obj.is_a? Collection
      url += "collections/#{obj.id}"
    elsif obj.is_a? Item
      url += "items/#{obj.id}"
    end
    url
  end

  def frontend_url_for_type(obj)
    return admin_root_url if obj == Role::SHAPE_ADMIN.to_s.titleize

    url = "#{root_url}#{obj.organization.slug}/"

    if obj.is_a? Collection
      "#{url}collections"
    elsif obj.is_a? Item
      "#{url}items"
    end
    url
  end

  def javascript_packs_with_polyfill(*packs)
    javascript_packs_with_chunks_tag 'babel-polyfill', *packs
  end
end
